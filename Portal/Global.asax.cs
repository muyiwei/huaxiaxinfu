using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using OThinker.H3.Controllers;
using System.Threading;
using OThinker.Clusterware;

namespace OThinker.H3.Portal
{
    /// <summary>
    /// 应用程序配置
    /// </summary>
    public class MvcApplication : System.Web.HttpApplication
    {
        /// <summary>
        /// 全局启动事件
        /// </summary>
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            // 检查是否要启动回收程序
            AppUtility.StartRecycling(this.Server);
            // BundleConfig.RegisterBundles(BundleTable.Bundles);
        }

        /// <summary>
        /// 页面请求开始
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void Application_BeginRequest(Object sender, EventArgs e)
        {
            // 输入Portal转向到Index.html页面
            if (Context.Request.FilePath == AppUtility.PortalRoot || Context.Request.FilePath == AppUtility.PortalRoot + "/")
            {
                if (OThinker.H3.Controllers.AppConfig.ConnectionMode == ConnectionStringParser.ConnectionMode.Mono)
                {
                    AppUtility.Engine.LogWriter.Write("Request Path:" + Context.Request.RawUrl);
                    Context.Response.Redirect(AppUtility.PortalRoot + "/index.html");
                }
            }
            HttpRequestBase request = new HttpRequestWrapper(this.Context.Request);
            // ajax请求,取消FormsAuthenticationRedirect.
            if (request.IsAjaxRequest())
            {
                Context.Response.SuppressFormsAuthenticationRedirect = true;
            }

            if (Context.Request.Url.ToString().IndexOf("ThreadAdmin", StringComparison.OrdinalIgnoreCase) == -1)
            {
                AddCurrentThread();
            }
        }

        /// <summary>
        /// 页面请求结束
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void Application_EndRequest(Object sender, EventArgs e)
        {
            RemoveCurrentThread();
        }

        private static object lockObject = new object();

        /// <summary>
        /// 添加当前线程
        /// </summary>
        protected void AddCurrentThread()
        {
            try
            {
                Monitor.Enter(lockObject);

                if (Application["ThreadMessageCollection"] == null)
                {
                    Application["ThreadMessageCollection"] = new ThreadMessageCollection();
                }
                ThreadMessageCollection threadTable = Application["ThreadMessageCollection"] as ThreadMessageCollection;

                threadTable.Add(new ThreadMessage()
                {
                    ModuleName = Context.Request.Url.ToString(),
                    MethodName = Context.Request.UserAgent,
                    Parameters = new object[] { Context.Request.UserHostAddress },
                    ThreadId = Thread.CurrentThread.ManagedThreadId,
                    StartTime = DateTime.Now
                }, Thread.CurrentThread);
            }
            finally
            {
                Monitor.Exit(lockObject);
            }
        }

        /// <summary>
        /// 移除当前线程
        /// </summary>
        protected void RemoveCurrentThread()
        {
            try
            {
                Monitor.Enter(lockObject);

                if (Application["ThreadMessageCollection"] == null)
                {
                    return;
                }
                ThreadMessageCollection threadTable = Application["ThreadMessageCollection"] as ThreadMessageCollection;
                threadTable.Remove(Thread.CurrentThread.ManagedThreadId);
            }
            finally
            {
                Monitor.Exit(lockObject);
            }
        }

        protected void Session_End(object sender, EventArgs e)
        {
            // Code that runs when a session ends. 
            // Note: The Session_End event is raised only when the sessionstate mode
            // is set to InProc in the Web.config file. If session mode is set to StateServer 
            // or SQLServer, the event is not raised.
            if (this.Context == null) return;
            UserValidator userInSession = this.Session[Sessions.GetUserValidator()] as UserValidator;
            if (userInSession != null)
            {
                AppUtility.OnUserLogout(userInSession, this.Request);
            }
        }
    }
}
