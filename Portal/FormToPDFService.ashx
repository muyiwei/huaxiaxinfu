<%@ WebHandler Language="C#" CodeBehind="FormToPDFService.ashx.cs" Class="OThinker.H3.Portal.FormToPDFService" %>
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Web; 

namespace OThinker.H3.Portal
{
    /// <summary>
    /// FormToPDFService 的摘要说明
    /// </summary>
    public class FormToPDFService : IHttpHandler
    {
        #region 流程引擎的接口
        private IEngine _Engine = null;
        /// <summary>
        /// 流程引擎的接口，该接口会比this.Engine的方式更快，因为其中使用了缓存
        /// </summary>
        public IEngine Engine
        {
            get
            {
                if (OThinker.H3.Controllers.AppConfig.ConnectionMode == ConnectionStringParser.ConnectionMode.Mono)
                {
                    return OThinker.H3.Controllers.AppUtility.Engine;
                }
                return _Engine;
            }
            set
            {
                _Engine = value;
            }
        }
        #endregion

        public void ProcessRequest(HttpContext context)
        {
            this.Engine.LogWriter.Write(string.Format("表单转PDF开始 流程名称：{0}", context.Request["Titlename"].ToString()));
            //接收页面参数
            //string strTitle = context.Request["Titlename"].ToString(); 
            string strHtml = context.Request["Htmlstring"].ToString();
            strHtml = System.Web.HttpUtility.UrlDecode(strHtml);

            string fileName = DateTime.Now.ToString("yyyyMMddHHmmss") + ".pdf";
            string filePath = System.Web.HttpContext.Current.Server.MapPath("TempImages") + "/" + fileName;
            //执行转换操作
            bool flag = HtmlTextConvertToPdf(strHtml, filePath);
            if (flag)
            {
                context.Response.Write(fileName);
                this.Engine.LogWriter.Write(string.Format("成功  表单转PDF结束 流程名称：{0};生成文件名称{1}", context.Request["Titlename"].ToString(), fileName));
            }
            else {
                this.Engine.LogWriter.Write(string.Format(" 失败 表单转PDF结束 流程名称：{0};生成文件名称{1}", context.Request["Titlename"].ToString(), fileName));
            }
        }

        #region HTML文本内容转换为PDF
        /// <summary>
        /// HTML文本内容转换为PDF
        /// </summary>
        /// <param name="strHtml">HTML文本内容</param>
        /// <param name="savePath">PDF文件保存的路径</param>
        /// <returns></returns>
        public bool HtmlTextConvertToPdf(string strHtml, string savePath)
        {
            bool flag = false;
            try
            {
                string htmlPath = HtmlTextConvertFile(strHtml);
                flag = HtmlConvertToPdf(htmlPath, savePath);

                File.Delete(htmlPath);
            }
            catch (Exception e)
            {
                flag = false;
            }
            return flag;
        }
        #endregion

        #region HTML转换为PDF
        /// <summary>
        /// HTML转换为PDF
        /// </summary>
        /// <param name="htmlPath">可以是本地路径，也可以是网络地址</param>
        /// <param name="savePath">PDF文件保存的路径</param>
        /// <returns></returns>
        public bool HtmlConvertToPdf(string htmlPath, string savePath)
        {
            bool flag = false;
            CheckFilePath(savePath);
            ///这个路径为程序集的目录，因为我把应用程序 wkhtmltopdf.exe 放在了程序集同一个目录下
            string exePath = AppDomain.CurrentDomain.BaseDirectory.ToString() + "wkhtmltopdf.exe";
            if (!File.Exists(exePath))
            {
                this.Engine.LogWriter.Write(string.Format("表单转PDF执行 wkhtmltopdf.exe 转换程序不存在"));
               
            }
            try
            {
                ProcessStartInfo processStartInfo = new ProcessStartInfo();
                processStartInfo.FileName = exePath;
                processStartInfo.WorkingDirectory = Path.GetDirectoryName(exePath);
                processStartInfo.UseShellExecute = false;
                processStartInfo.CreateNoWindow = true;
                processStartInfo.RedirectStandardInput = true;
                processStartInfo.RedirectStandardOutput = true;
                processStartInfo.RedirectStandardError = true;
                processStartInfo.Arguments = GetArguments(htmlPath, savePath);
                Process process = new Process();
                process.StartInfo = processStartInfo;
                process.Start();
                process.WaitForExit();

                ///用于查看是否返回错误信息
                //StreamReader srone = process.StandardError;
                //StreamReader srtwo = process.StandardOutput;
                //string ss1 = srone.ReadToEnd();
                //string ss2 = srtwo.ReadToEnd();
                //srone.Close();
                //srone.Dispose();
                //srtwo.Close();
                //srtwo.Dispose();
                process.Close();
                process.Dispose();
                flag = true;
                
            }
            catch(Exception ee)
            {
                this.Engine.LogWriter.Write(string.Format("表单转PDF执行异常: 方法：{0};异常提示：{1}","HtmlConvertToPdf",ee.GetBaseException().ToString()));
                flag = false;
            }
            return flag;
        }
        #endregion

        #region 获取命令行参数
        /// <summary>
        /// 获取命令行参数
        /// </summary>
        /// <param name="htmlPath"></param>
        /// <param name="savePath"></param>
        /// <returns></returns>
        private string GetArguments(string htmlPath, string savePath)
        {
            if (string.IsNullOrEmpty(htmlPath) || string.IsNullOrEmpty(savePath))
            {
                this.Engine.LogWriter.Write(string.Format("表单转PDF执行异常: 方法：{0};异常提示：{1}", "GetArguments", "存储路径不能为空"));
                return "";
            }

            StringBuilder stringBuilder = new StringBuilder();
            //stringBuilder.Append(" --page-height 100 ");        //页面高度100mm
            //stringBuilder.Append(" --page-width 100 ");         //页面宽度100mm
            //stringBuilder.Append(" --header-center 我是页眉 ");  //设置居中显示页眉
            //stringBuilder.Append(" --header-line ");         //页眉和内容之间显示一条直线
            //stringBuilder.Append(" --footer-center \"Page [page] of [topage]\" ");    //设置居中显示页脚
            //stringBuilder.Append(" --footer-line ");       //页脚和内容之间显示一条直线
            stringBuilder.Append(" " + htmlPath + " ");       //本地 HTML 的文件路径或网页 HTML 的URL地址
            stringBuilder.Append(" " + savePath + " ");       //生成的 PDF 文档的保存路径
            return stringBuilder.ToString();
        }
        #endregion

        #region 验证保存路径
        /// <summary>
        /// 验证保存路径
        /// </summary>
        /// <param name="savePath"></param>
        private void CheckFilePath(string savePath)
        {
            string ext = string.Empty;
            string path = string.Empty;
            string fileName = string.Empty;

            ext = Path.GetExtension(savePath);
            if (string.IsNullOrEmpty(ext) || ext.ToLower() != ".pdf")
            {
                this.Engine.LogWriter.Write(string.Format("表单转PDF执行异常: 方法：{0};异常提示：{1}", "CheckFilePath", "文件类型错误"));
            }

            try
            {
                path = savePath.Substring(0, savePath.IndexOf(fileName));
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                }
            }
            catch(Exception ee)
            {
                this.Engine.LogWriter.Write(string.Format("表单转PDF执行异常: 方法：{0};异常提示：{1}", "CheckFilePath", ee.GetBaseException().ToString()));
            }
        }
        #endregion

        #region HTML文本内容转HTML文件
        /// <summary>
        /// HTML文本内容转HTML文件
        /// </summary>
        /// <param name="strHtml">HTML文本内容</param>
        /// <returns>HTML文件的路径</returns>
        public string HtmlTextConvertFile(string strHtml)
        {
            try
            {
                string path = AppDomain.CurrentDomain.BaseDirectory.ToString() + @"html\";
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                }
                string fileName = path + DateTime.Now.ToString("yyyyMMddHHmmssfff") + new Random().Next(1000, 10000) + ".html";
                FileStream fileStream = new FileStream(fileName, FileMode.Create, FileAccess.ReadWrite, FileShare.ReadWrite);
                StreamWriter streamWriter = new StreamWriter(fileStream, Encoding.Default);
                streamWriter.Write(strHtml);
                streamWriter.Flush();

                streamWriter.Close();
                streamWriter.Dispose();
                fileStream.Close();
                fileStream.Dispose();
                return fileName;
            }
            catch(Exception ee)
            {
                this.Engine.LogWriter.Write(string.Format("表单转PDF执行异常: 方法：{0};异常提示：{1}", "HtmlTextConvertFile", ee.GetBaseException().ToString()));
                throw new Exception("HTML text content error.");
            }
        }
        #endregion

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}