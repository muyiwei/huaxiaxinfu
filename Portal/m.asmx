<%@ WebService Language="C#" Class="OThinker.H3.Portal.m" %>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Services;
using System.Data;
using OThinker.Organization;
using System.Web.Script.Services;
using OThinker.H3.Controllers;

namespace OThinker.H3.Portal
{
    /// <summary>
    /// 流程实例操作相关接口
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.None)]
    [System.Web.Script.Services.ScriptService]
    //若要允许使用 ASP.NET AJAX 从脚本中调用此 Web 服务，请取消对下行的注释。 
    // [System.Web.Script.Services.ScriptService]
    public class m : System.Web.Services.WebService
    {
        /// <summary>
        /// 构造函数
        /// </summary>
        public m()
        {
            //如果使用设计的组件，请取消注释以下行 
            //InitializeComponent(); 
        }

        public IEngine _Engine = null;
        /// <summary>
        /// 获取引擎实例对象
        /// </summary>
        public IEngine Engine
        {
            get
            {
                if (_Engine == null)
                {
                    _Engine = OThinker.H3.Controllers.AppUtility.Engine;
                }
                return _Engine;
            }
        }

        private System.Web.Script.Serialization.JavaScriptSerializer jsSerializer = null;
        /// <summary>
        /// 获取JOSN序列化对象
        /// </summary>
        private System.Web.Script.Serialization.JavaScriptSerializer JSSerializer
        {
            get
            {
                if (jsSerializer == null)
                {
                    jsSerializer = new System.Web.Script.Serialization.JavaScriptSerializer();
                }
                return jsSerializer;
            }
        }

        /// <summary>
        /// 返回前端调用方法
        /// </summary>
        private string CallbackMethod
        {
            get
            {
                return HttpContext.Current.Request["callback"] + string.Empty;
            }
        }

        /// <summary>
        /// 输出JSON格式到前端
        /// </summary>
        /// <param name="json"></param>
        private void ResponseJSON(string json)
        {
            HttpContext.Current.Response.ContentType = "application/json;charset=UTF-8";
            HttpContext.Current.Response.Write(string.Format("{0}({1})", CallbackMethod, json));
            HttpContext.Current.Response.End();
        }

        /// <summary>
        /// 检查是否有新版本需要更新
        /// </summary>
        /// <param name="platform">终端类型</param>
        /// <param name="version">终端版本号</param>
        /// <returns></returns>
        [WebMethod(Description = "加载用户的待办任务,上次加载时间")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void CheckVersion(string platform, string version)
        {
            object result = null;
            // 客户端会与 Version 进行比较，如果版本号不对，那么会提示或强制客户端进行升级
            if (platform.ToLower().IndexOf("android") > -1)
            {// Android
                result = new
                {
                    Version = "1.0.0",             // 最新版本号
                    Confirm = true.ToString(),     // 终端是否提示
                    Description = "新版本：1.0.0<br>更新特性：<br>1.发起流程更新",               // 更新说明
                    Url = "http://121.40.136.138:8010/Portal/H3.apk"   // APK下载地址
                };
            }
            else
            {// iOS 版本
                result = new
                {
                    Version = "1.0.0",             // 最新版本号
                    Confirm = true.ToString(),     // 终端是否提示
                    Description = "新版本：1.0.0<br>更新特性：<br>1.发起流程更新",               // 更新说明
                    Url = ""   // APK下载地址
                };
            }

            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 更新JPushId
        /// </summary>
        /// <param name="userCode">用户编码</param>
        /// <param name="jpushId">极光推送ID</param>
        [WebMethod(EnableSession = true, Description = "更新JPushId")]
        public void UpdateJpushID(string userCode, string jpushId)
        {
            UserValidator userValidator = UserValidatorFactory.GetUserValidator(this.Engine, userCode);
            if (userValidator != null && userValidator.User != null)
            {
                userValidator.User.JPushID = jpushId;
                this.Engine.Organization.UpdateUnit(userValidator.User.ObjectID, userValidator.User);
            }
        }
        /// <summary>
        /// 移动办公用户登录
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="password"></param>
        /// <param name="uuid"></param>
        /// <param name="jpushId"></param>
        /// <param name="mobileToken"></param>
        /// <param name="mobileType"></param>
        /// <param name="isAppLogin">是否App登录</param>
        [WebMethod(EnableSession = true, Description = "用户登录")]
        public void ValidateLogin(string userCode,
            string password,
            string uuid,
            string jpushId,
            string mobileToken,
            string mobileType,
            bool isAppLogin)
        {
            OThinker.H3.Controllers.OrganizationController login = new OThinker.H3.Controllers.OrganizationController();
            var result = login.LoginInMobile(userCode, password, uuid, jpushId, mobileToken, mobileType, isAppLogin);
            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 验证获取信息的用户身份
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        /// <returns></returns>
        private UserValidator ValidateUserMobileToken(string userCode, string mobileToken)
        {
            UserValidator userValidator = UserValidatorFactory.GetUserValidator(this.Engine, userCode);

            if (userValidator == null) return null;
            if (userValidator.User == null || userValidator.User.State == State.Inactive
                || userValidator.User.ServiceState == UserServiceState.Dismissed || userValidator.User.IsVirtualUser)
            {// 虚拟用户、离职、禁用用户不允许操作  
                ResponseJSON(JSSerializer.Serialize(new ActionResult(false, "您没有访问的权限！", null, ExceptionCode.NoAuthorize)));
            }
            //if (userValidator.User.MobileToken == OThinker.Security.MD5Encryptor.GetMD5(mobileToken))
            if (userValidator.User.MobileToken == mobileToken)
            {
                return userValidator;
            }
            return null;
        }

        /// <summary>
        /// 验证用户身份
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="mobileToken"></param>
        /// <returns></returns>
        private bool ValidateMobileToken(string userId, string mobileToken)
        {
            OThinker.Organization.User user = this.Engine.Organization.GetUnit(userId) as OThinker.Organization.User;

            if (user == null || user.State == State.Inactive
                || user.ServiceState == UserServiceState.Dismissed || user.IsVirtualUser)
            {// 虚拟用户、离职、禁用用户不允许操作  
                ResponseJSON(JSSerializer.Serialize(new ActionResult(false, "您没有访问的权限！", null, ExceptionCode.NoAuthorize)));
            }
            return user == null ? false : user.ValidateMobileToken(mobileToken);
        }

        //[WebMethod(Description = "获取任务移动端Badge")]
        //[ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        //public void GetBadgeNum(string userId, string mobileToken)
        //{
        //    if (!ValidateMobileToken(userId, mobileToken)) return;
        //    MobileAccess mobile = new MobileAccess();
        //    var result = mobile.GetBadgeNum(userId, mobileToken);
        //    ResponseJSON(JSSerializer.Serialize(result));
        //}

        #region 待办任务 -------------------------
        /// <summary>
        /// 获取任务是否已经结束
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="mobileToken"></param>
        /// <param name="workItemId"></param>
        [WebMethod(Description = "获取任务是否已经结束")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void IsWorkItemFinished(string userId, string mobileToken, string workItemId)
        {
            if (!ValidateMobileToken(userId, mobileToken)) return;

            bool isFinished = true;
            OThinker.H3.WorkItem.WorkItem workitem = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            if (workitem != null &&
                (workitem.State == WorkItem.WorkItemState.Waiting || workitem.State == WorkItem.WorkItemState.Working))
            {
                isFinished = false;
            }

            var result = new
            {
                Finished = isFinished
            };

            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 加载用户的待办任务
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="mobileToken">用户身份</param>
        /// <param name="keyWord">搜索关键字</param>
        /// <param name="lastTime">最后时间</param>
        /// <param name="sortKey">排序字段</param>
        /// <param name="sortDirection">排序方式</param>
        /// <param name="finishedWorkItem">是否已办任务</param>
        [WebMethod(Description = "加载用户的待办任务,上次加载时间")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void LoadWorkItems(string userId, string mobileToken, string keyWord,
            string sortKey, string loadStart, string sortDirection,
            bool isFinished, int IsPriority, string Originators,
            string startDate, string endDate)
        {
            //开始时间
            DateTime? startTime = null;
            DateTime startTimeTemp = System.DateTime.Now;
            if (DateTime.TryParse(startDate, out startTimeTemp))
            {
                startTime = startTimeTemp;
            }

            //结束时间
            DateTime? endTime = null;
            DateTime endTimeTemp = System.DateTime.Now;
            if (DateTime.TryParse(endDate, out endTimeTemp))
            {
                endTime = endTimeTemp;
            }
            //发起者
            string[] orgs = null;
            if (!string.IsNullOrEmpty(Originators.TrimEnd(',')))
            {
                orgs = Originators.TrimEnd(',').Split(',');
            }

            int? priority = null;
            if (IsPriority != -1) priority = IsPriority;

            int loadNum = 0;
            int.TryParse(loadStart, out  loadNum);
            userId = AppUtility.RegParam(userId);
            keyWord = AppUtility.RegParam(keyWord);
            if (!ValidateMobileToken(userId, mobileToken)) return;
            MobileAccess mobile = new MobileAccess();
            OThinker.H3.Controllers.MobileAccess.WorkItemQueryParams Params = new OThinker.H3.Controllers.MobileAccess.WorkItemQueryParams()
            {
                userId = userId,
                mobileToken = mobileToken,
                keyWord = keyWord,
                sortKey = sortKey,
                sortDirection = sortDirection,
                finishedWorkItem = isFinished,
                IsPriority = priority,
                Originators = orgs,
                endDate = endTime,
                startDate = startTime,
                loadStart = loadNum
            };
            var result = mobile.GetLoadWorkItems(Params);
            //处理APP端图片路径,将相对路径替换为绝对路径
            mobile.SetImageUrl(result.WorkItems, HttpContext.Current.Request.Url);
            //var result = mobile.LoadWorkItems(userId, mobileToken, keyWord, lastTime, sortKey, sortDirection, finishedWorkItem);
            if (result == null) return;
            ResponseJSON(JSSerializer.Serialize(result));
        }


        /// <summary>
        /// 获取待办，已办任务列表，不区分优先级
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="mobileToken"></param>
        /// <param name="keyWord"></param>
        /// <param name="lastTime"></param>
        /// <param name="sortKey"></param>
        /// <param name="sortDirection"></param>
        /// <param name="finishedWorkItem"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取待办，已办任务列表，不区分优先级")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetWorkItems(MobileAccess.WorkItemQueryParams Params)
        {
            int returnCount = 10;//返回数量，默认为10；
            if (!ValidateMobileToken(Params.userId, Params.mobileToken)) return;
            MobileAccess mobile = new MobileAccess();
            var Items = mobile.GetLoadWorkItems(Params);
            mobile.SetImageUrl(Items.WorkItems, HttpContext.Current.Request.Url);
            ResponseJSON(JSSerializer.Serialize(Items));
        }


        /// <summary>
        /// 获取待办，已办任务列表，按高优先级，普通区分
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="mobileToken"></param>
        /// <param name="keyWord"></param>
        /// <param name="lastTime"></param>
        /// <param name="sortKey"></param>
        /// <param name="sortDirection"></param>
        /// <param name="finishedWorkItem"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取待办，已办任务列表，区分优先级")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetWorkItemsByPriority(MobileAccess.WorkItemQueryParams Params)
        {
            if (!ValidateMobileToken(Params.userId, Params.mobileToken)) return;

            //Params.returnCount = 10;//返回数量，默认为10；
            //Params.lastTime = DateTime.Now;
            MobileAccess mobile = new MobileAccess();
            bool showNormal = true;//是否需要查询普通优先级
            OThinker.H3.Controllers.MobileAccess.LoadWorkItemsClass NormalPriorityItems = new H3.Controllers.MobileAccess.LoadWorkItemsClass();
            var HighPriorityItems = mobile.GetLoadWorkItems(Params);

            if (HighPriorityItems != null && HighPriorityItems.WorkItems.Count == 10)
            {
                showNormal = false;
            }
            else if (HighPriorityItems != null && HighPriorityItems.WorkItems.Count < 10)
            {
                //Params. = 10 - HighPriorityItems.WorkItems.Count;
            }

            if (showNormal)
            {
                NormalPriorityItems = mobile.GetLoadWorkItems(Params);
            }

            var result = new
            {
                HighPriorityItems = HighPriorityItems,
                NormalPriorityItems = NormalPriorityItems
            };

            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 获取用户的在办流程实例
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="mobileToken">用户身份</param>
        /// <param name="keyWord">搜索关键字</param>
        /// <param name="lastTime">最后时间</param>
        /// <param name="sortKey">排序字段</param>
        /// <param name="sortDirection">排序方式</param>
        [WebMethod(Description = "获取用户的在办流程实例,上次加载时间")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void LoadInstances(MobileAccess.InstanceQueryParams Params)
        {
            Params.sortKey = "ReceiveTime";
            Params.sortDirection = "Desc";
            //Params.lastTime = DateTime.Now;
            Params.userId = AppUtility.RegParam(Params.userId);
            Params.keyWord = AppUtility.RegParam(Params.keyWord);
            if (!ValidateMobileToken(Params.userId, Params.mobileToken)) return;
            MobileAccess mobile = new MobileAccess();
            var result = new object();
            if (Params.status == 5)
            {
                result = mobile.LoadCanceledInstance(Params);
            }
            else if (Params.status == 4)
            {
                result = mobile.LoadFinishedInstance(Params);
            }
            else
            {
                result = mobile.LoadUnFinishedInstance(Params);
            }
            ResponseJSON(JSSerializer.Serialize(result));
        }
        /// <summary>
        /// 加载流程状态
        /// </summary>
        /// <param name="mobileToken"></param>
        /// <param name="instanceId"></param>
        /// <param name="workflowCode"></param>
        [WebMethod(Description = "加载流程状态")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void LoadInstanceState(string userId, string userCode, string mobileToken, string instanceId)
        {
            if (!ValidateMobileToken(userId, mobileToken)) return;
            UserValidator userValidate = ValidateUserMobileToken(userCode, mobileToken);
            MobileAccess mobile = new MobileAccess();
            var result = mobile.LoadInstanceState(userId, mobileToken, instanceId, userValidate);
            if (result == null) return;
            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 刷新用户的待办任务
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="mobileToken">用户身份</param>
        /// <param name="keyWord">查询关键字</param>
        /// <param name="lastTime">最后刷新时间</param>
        [WebMethod(Description = "加载用户的待办任务,上次刷新时间")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void RefreshInstances(string userId, string mobileToken, string keyWord, DateTime lastTime)
        {
            userId = AppUtility.RegParam(userId);
            if (!ValidateMobileToken(userId, mobileToken)) return;

            MobileAccess mobile = new MobileAccess();
            var result = mobile.RefreshInstances(userId, mobileToken, keyWord, lastTime);
            if (result == null) return;
            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 刷新用户的待办任务
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="mobileToken">用户身份</param>
        /// <param name="keyWord">查询关键字</param>
        /// <param name="lastTime">最后刷新时间</param>
        /// <param name="finishedWorkItem">是否加载已办任务</param>
        /// <param name="existsLength">返回待办任务ID的数量</param>
        [WebMethod(Description = "加载用户的待办任务,上次刷新时间")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void RefreshWorkItem(string userId,
            string mobileToken,
            string keyWord,
            DateTime lastTime,
            bool finishedWorkItem,
            int existsLength)
        {
            userId = AppUtility.RegParam(userId);
            if (!ValidateMobileToken(userId, mobileToken)) return;

            MobileAccess mobile = new MobileAccess();
            var result = mobile.RefreshWorkItem(userId, mobileToken, keyWord, lastTime, finishedWorkItem, existsLength);
            if (result == null) return;
            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 刷新待办任务，不区分优先级
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="mobileToken"></param>
        /// <param name="keyword"></param>
        /// <param name="highLastTime"></param>
        /// <param name="normalLastTime"></param>
        /// <param name="finishedWrokItem"></param>
        /// <param name="existsLengthHigh"></param>
        /// <param name="existsLenthNormal"></param>
        /// <returns></returns>
        [WebMethod(Description = "刷新任务列表,不区分优先级")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetRefreshWorkItems(string userId, string mobileToken, string keyWord, DateTime LastTime,
            bool finishedWorkItem, int existsLength)
        {
            int returnCount = 10;//返回数量，默认为10；

            MobileAccess mobile = new MobileAccess();
            var Items = mobile.GetRefreshWorkItemsFn(userId, mobileToken, keyWord, LastTime,
                finishedWorkItem, existsLength, Instance.PriorityType.Unspecified, null, null, returnCount);
            ResponseJSON(JSSerializer.Serialize(Items));

        }

        /// <summary>
        /// 刷新任务列表
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="mobileToken"></param>
        /// <param name="keyword"></param>
        /// <param name="highLastTime"></param>
        /// <param name="normalLastTime"></param>
        /// <param name="finishedWrokItem"></param>
        /// <param name="existsLengthHigh"></param>
        /// <param name="existsLenthNormal"></param>
        /// <returns></returns>
        [WebMethod(Description = "刷新任务列表,区分优先级")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetRefreshWorkItemsByPriority(string userId, string mobileToken, string keyword, DateTime highLastTime,
            DateTime normalLastTime, bool finishedWorkItem, int existsLengthHigh, int existsLenthNormal)
        {
            int returnCount = 10;//返回数量，默认为10；
            bool showNormal = true;//是否需要查询普通优先级
            MobileAccess mobile = new MobileAccess();
            H3.Controllers.MobileAccess.RefreshWorkItemsClass NormalRefreshWrokitem = new H3.Controllers.MobileAccess.RefreshWorkItemsClass();
            var HighRefreshWrokitem = mobile.GetRefreshWorkItemsFn(userId, mobileToken, keyword, highLastTime, finishedWorkItem, existsLengthHigh, Instance.PriorityType.High, DateTime.Parse("2004-01-01"), DateTime.MaxValue, returnCount);

            if (HighRefreshWrokitem != null && HighRefreshWrokitem.WorkItems.Count == 10)
            {
                showNormal = false;
            }
            else if (HighRefreshWrokitem != null && HighRefreshWrokitem.WorkItems.Count < 10)
            {
                returnCount = 10 - HighRefreshWrokitem.WorkItems.Count;
            }

            if (showNormal)
            {
                NormalRefreshWrokitem = mobile.GetRefreshWorkItemsFn(userId, mobileToken, keyword, highLastTime, finishedWorkItem, existsLenthNormal, Instance.PriorityType.Normal, DateTime.Parse("2004-01-01"), DateTime.MaxValue, returnCount);
            }

            var result = new
            {
                HighRefreshWrokitem = HighRefreshWrokitem,
                NormalRefreshWrokitem = NormalRefreshWrokitem
            };

            ResponseJSON(JSSerializer.Serialize(result));
        }




        /// <summary>
        /// 刷新用户的待办任务
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="mobileToken">用户身份</param>
        /// <param name="keyWord">查询关键字</param>
        /// <param name="lastTime">最后刷新时间</param>
        /// <param name="finishedWorkItem">是否加载已办任务</param>
        [WebMethod(Description = "加载用户的待办任务,上次刷新时间")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void RefreshWorkItems(string userId, string mobileToken, string keyWord, DateTime lastTime, bool finishedWorkItem)
        {
            RefreshWorkItem(userId, mobileToken, keyWord, lastTime, finishedWorkItem, 0);
        }

        #region 待阅、已阅
        /// <summary>
        /// 加载用户的待阅任务
        /// </summary>
        /// <param name="userId">用户ID</param>
        /// <param name="mobileToken">用户身份</param>
        /// <param name="keyWord">搜索关键字</param>
        /// <param name="lastTime">最后时间</param>
        /// <param name="sortKey">排序字段</param>
        /// <param name="sortDirection">排序方式</param>
        /// <param name="readWorkItem">是否已阅任务</param>
        [WebMethod(Description = "加载用户的待办任务,上次加载时间")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void LoadCirculateItems(string userId, string mobileToken, string keyWord,
            string sortKey, string loadStart, string sortDirection,
            bool isFinished, int IsPriority, string Originators,
            string startDate, string endDate)
        {
            //开始时间
            DateTime? startTime = null;
            DateTime startTimeTemp = System.DateTime.Now;
            if (DateTime.TryParse(startDate, out startTimeTemp))
            {
                startTime = startTimeTemp;
            }

            //结束时间
            DateTime? endTime = null;
            DateTime endTimeTemp = System.DateTime.Now;
            if (DateTime.TryParse(endDate, out endTimeTemp))
            {
                endTime = endTimeTemp;
            }
            //发起者
            string[] orgs = null;
            if (!string.IsNullOrEmpty(Originators.TrimEnd(',')))
            {
                orgs = Originators.TrimEnd(',').Split(',');
            }

            int? priority = null;
            if (IsPriority != -1) priority = IsPriority;

            int loadNum = 0;
            int.TryParse(loadStart, out  loadNum);
            userId = AppUtility.RegParam(userId);
            keyWord = AppUtility.RegParam(keyWord);
            if (!ValidateMobileToken(userId, mobileToken)) return;
            MobileAccess mobile = new MobileAccess();
            OThinker.H3.Controllers.MobileAccess.CirculateItemQueryParams Params = new OThinker.H3.Controllers.MobileAccess.CirculateItemQueryParams()
            {
                userId = userId,
                mobileToken = mobileToken,
                keyWord = keyWord,
                sortKey = sortKey,
                sortDirection = sortDirection,
                readWorkItem = isFinished,
                IsPriority = priority,
                Originators = orgs,
                endDate = endTime,
                startDate = startTime,
                loadStart = loadNum
            };
            Params.userId = AppUtility.RegParam(Params.userId);
            Params.keyWord = AppUtility.RegParam(Params.keyWord);
            //if (!Params.lastTime.HasValue)
            //    Params.lastTime = DateTime.Now;
            var result = mobile.LoadCirculateItemsFn(Params);
            if (result == null) return;
            ResponseJSON(JSSerializer.Serialize(result));

        }

        /// <summary>
        /// 刷新用户的待阅任务
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="mobileToken"></param>
        /// <param name="keyWord"></param>
        /// <param name="lastTime"></param>
        /// <param name="readWorkItem"></param>
        /// <param name="existsLength"></param>
        [WebMethod(Description = "加载用户的待办任务,上次加载时间")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void RefreshCirculateItems(string userId,
           string mobileToken,
           string keyWord,
           DateTime lastTime,
           bool readWorkItem,
           int existsLength)
        {
            userId = AppUtility.RegParam(userId);
            keyWord = AppUtility.RegParam(keyWord);
            if (!ValidateMobileToken(userId, mobileToken)) return;
            MobileAccess mobile = new MobileAccess();
            var result = mobile.RefreshCirculateItemFn(userId, mobileToken, keyWord, lastTime, readWorkItem, existsLength);
            if (result == null) return;
            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 执行已阅
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="mobileToken"></param>
        /// <param name="CirculateItemIDs"></param>
        [WebMethod(Description = "执行已阅")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void ReadCirculateItems(string userId,
           string mobileToken,
           string CirculateItemIDs,
            bool ReadAll)
        {
            userId = AppUtility.RegParam(userId);
            CirculateItemIDs = AppUtility.RegParam(CirculateItemIDs);
            if (!ValidateMobileToken(userId, mobileToken)) return;
            MobileAccess CirculateItem = new MobileAccess();
            var result = CirculateItem.ReadCirculateItemsByBatchFn(userId, mobileToken, CirculateItemIDs, ReadAll);
            ResponseJSON(JSSerializer.Serialize(result));
        }
        #endregion

        #region 我的实例
        [WebMethod(Description = "获取全部实例")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void LoadAllInstances(string userId, string mobileToken, string keyWord,
            string refreshTime, string loadStart,
             int IsPriority, int status,
            string startDate, string endDate)
        {
            //开始时间
            DateTime? startTime = null;
            DateTime startTimeTemp = System.DateTime.Now;
            if (DateTime.TryParse(startDate, out startTimeTemp))
            {
                startTime = startTimeTemp;
            }

            //结束时间
            DateTime? endTime = null;
            DateTime endTimeTemp = System.DateTime.Now;
            if (DateTime.TryParse(endDate, out endTimeTemp))
            {
                endTime = endTimeTemp;
            }

            //结束时间
            DateTime? refreshDate = null;
            DateTime refreshTimeTemp = System.DateTime.Now;
            if (DateTime.TryParse(refreshTime, out refreshTimeTemp))
            {
                refreshDate = refreshTimeTemp;
            }

            int? priority = null;
            if (IsPriority != -1) priority = IsPriority;
            int loadNum = 0;
            int.TryParse(loadStart, out  loadNum);
            OThinker.H3.Controllers.MobileAccess.InstanceQueryParams Params = new MobileAccess.InstanceQueryParams()
            {
                userId = userId,
                mobileToken = mobileToken,
                keyWord = keyWord,
                loadStart = loadNum,
                refreshTime = refreshDate,
                status = status,
                IsPriority = priority,
                startDate = startTime,
                endDate = endTime
            };
            //userId = AppUtility.RegParam(userId);
            if (!ValidateMobileToken(Params.userId, Params.mobileToken)) return;
            MobileAccess mobileAccess = new MobileAccess();
            //DateTime lastTime = DateTime.Now;
            //if (Params.lastTime.Equals(default(DateTime)))
            //    Params.lastTime = DateTime.Now;
            var result = mobileAccess.LoadAllInstanceList(Params);
            OThinker.H3.Controllers.MobileAccess.MyInstance instances = (OThinker.H3.Controllers.MobileAccess.MyInstance)result.Extend;
            mobileAccess.SetImageUrl(instances.unfinished.WorkItems, HttpContext.Current.Request.Url);
            mobileAccess.SetImageUrl(instances.finished.WorkItems, HttpContext.Current.Request.Url);
            mobileAccess.SetImageUrl(instances.cancel.WorkItems, HttpContext.Current.Request.Url);
            result.Extend = instances;
            ResponseJSON(JSSerializer.Serialize(result));
        }

        [WebMethod(Description = "搜索指定条件的流程实例")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void LoadInstacne(string userId, string mobileToken, string keyWord,
             int IsPriority, int status, string startDate, string endDate)
        {
            //开始时间
            DateTime? startTime = null;
            DateTime startTimeTemp = System.DateTime.Now;
            if (DateTime.TryParse(startDate, out startTimeTemp))
            {
                startTime = startTimeTemp;
            }

            //结束时间
            DateTime? endTime = null;
            DateTime endTimeTemp = System.DateTime.Now;
            if (DateTime.TryParse(endDate, out endTimeTemp))
            {
                endTime = endTimeTemp;
            }

            int? priority = null;
            if (IsPriority != -1) priority = IsPriority;
            OThinker.H3.Controllers.MobileAccess.LoadWorkItemsClass result = new OThinker.H3.Controllers.MobileAccess.LoadWorkItemsClass();
            MobileAccess mobileAccess = new MobileAccess();

            OThinker.H3.Controllers.MobileAccess.InstanceQueryParams Params = new MobileAccess.InstanceQueryParams()
            {
                userId = userId,
                mobileToken = mobileToken,
                keyWord = keyWord,
                status = status,
                IsPriority = priority,
                startDate = startTime,
                endDate = endTime
            };

            if (Params.status == (int)OThinker.H3.Instance.InstanceState.Canceled)
            {
                result = mobileAccess.LoadCanceledInstance(Params);
            }
            else if (Params.status == (int)OThinker.H3.Instance.InstanceState.Finished)
            {
                result = mobileAccess.LoadFinishedInstance(Params);
            }
            else
            {
                result = mobileAccess.LoadUnFinishedInstance(Params);
            }
            ResponseJSON(JSSerializer.Serialize(result));
        }

        [WebMethod(Description = "获取指定状态的流程实例")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void LoadInstancesByState(string userId, string mobileToken, string keyWord, int instanceState, int loadStart)
        {
            userId = AppUtility.RegParam(userId);
            if (!ValidateMobileToken(userId, mobileToken)) return;
            MobileAccess mobileAccess = new MobileAccess();
            var result = mobileAccess.LoadInstances(userId, Server.UrlDecode(keyWord), instanceState, loadStart);
            ResponseJSON(JSSerializer.Serialize(result));
        }


        [WebMethod(Description = "获取指定状态的流程实例")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void RefreshInstancesByState(string userId, string mobileToken, string keyWord, int instanceState, DateTime lastTime)
        {
            userId = AppUtility.RegParam(userId);
            if (!ValidateMobileToken(userId, mobileToken)) return;
            MobileAccess mobileAccess = new MobileAccess();
            var result = mobileAccess.RefreshInstancesByState(userId, keyWord, lastTime, instanceState);
            ResponseJSON(JSSerializer.Serialize(result));
        }
        #endregion

        /// <summary>
        /// 获取组织的名称
        /// </summary>
        /// <param name="units"></param>
        /// <param name="userId"></param>
        /// <returns></returns>
        private string GetUnitName(Unit[] units, string userId)
        {
            if (units == null) return string.Empty;
            foreach (Unit unit in units)
            {
                if (userId == unit.ObjectID)
                {
                    return unit.Name;
                }
            }
            return string.Empty;
        }
        #endregion

        #region ==>报表
        /// <summary>
        /// 获取报表配置信息
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        /// <param name="parentId"></param>
        [WebMethod(Description = "获取报表配置信息")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void LoadReportPage(string userCode, string mobileToken, string ReportCode)
        {
            UserValidator userValidator = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidator == null) return;

            MobileAccess mobile = new MobileAccess();
            Dictionary<string, string> boolDic = new Dictionary<string, string>();
            OThinker.Reporting.ReportPage Setting = (OThinker.Reporting.ReportPage)OThinker.Data.Utility.Clone(this.Engine.ReportManager.GetReportPage(ReportCode));
            if (Setting == null)
            {
                var notExist = new { State = false, Message = "报表配置不存在!" };
                ResponseJSON(JSSerializer.Serialize(notExist));
            }
            else
            {
                Setting.Filters = this.Engine.Interactor.GetReportFilters(ReportCode, Setting.ObjectID, out boolDic);
                if (Setting.Filters != null)
                {
                    for (int i = 0; i < Setting.Filters.Length; i++)
                    {
                        //如果是数据字典类型
                        if (Setting.Filters[i].FilterType == OThinker.H3.Reporting.FilterType.MasterData)
                        {
                            if (Setting.Filters[i].FilterValue != "")
                            {
                                OThinker.H3.Data.EnumerableMetadata[] masterdatas = this.Engine.MetadataRepository.GetByCategory(Setting.Filters[i].FilterValue);
                                string master = "";
                                for (int j = 0; j < masterdatas.Length; j++)
                                {


                                    if (j == masterdatas.Length - 1)
                                    {
                                        master = master + masterdatas[j].Code + "::" + masterdatas[j].EnumValue;
                                    }
                                    else
                                    {
                                        master = master + masterdatas[j].Code + "::" + masterdatas[j].EnumValue + ";;";
                                    }

                                }
                                Setting.Filters[i].FilterValue = master;
                            }
                        }
                    }
                }

                OThinker.H3.Acl.FunctionNode node = userValidator.GetFunctionNode(ReportCode);
                string displayName = node == null ? "" : node.DisplayName;
                OThinker.H3.Controllers.ControllerBase.UserInformation UserInformation = new OThinker.H3.Controllers.ControllerBase.UserInformation();
                UserInformation.UserID = userValidator.UserID;
                UserInformation.UserCode = userValidator.User.Code;
                UserInformation.UserDisplayName = userValidator.User.Name;
                Organization.Unit Company = Engine.Organization.GetUnit(userValidator.CompanyId);
                UserInformation.UserCompanyID = userValidator.CompanyId;
                UserInformation.UserCompanyCode = Company.UnitID;
                UserInformation.UserCompanyDisplayName = Company.Name;
                UserInformation.UserParentOUCode = Engine.Organization.GetUnit(userValidator.User.ParentID).UnitID;
                UserInformation.UserParentOUID = userValidator.User.ParentID;
                UserInformation.UserParentOUDisplayName = userValidator.DepartmentName;
                var result = new { State = true, ReportPage = Setting, CurrentUser = UserInformation, boolDic = boolDic, DisplayName = displayName };

                ResponseJSON(JSSerializer.Serialize(result));
            }
        }


        /// <summary>
        /// 获取明细表查询数据
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        [WebMethod(Description = "获取明细表查询数据")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = false)]
        public void LoadGridData(string userCode, string mobileToken, string Code, string FilterData, string WidgetID, string UnitFilterDataJson, string start, string length, string orderby, string dir)
        {
            UserValidator userValidator = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidator == null) return;
            MobileReportAccess mobile = new MobileReportAccess();
            var result = mobile.LoadGridData(userValidator, Code, FilterData, WidgetID, UnitFilterDataJson, start, length, orderby, dir);

            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 获取报表数据
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        [WebMethod(Description = "获取报表数据")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = false)]
        public void LoadChartsData(string userCode, string mobileToken, string FilterData, string ObjectId, string Code, string UnitFilterDataJson)
        {
            UserValidator userValidator = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidator == null) return;
            MobileReportAccess mobile = new MobileReportAccess();
            string Widget = "";
            string ReportPage = "";
            string ReportSource = "";
            string isDesign = "";
            var result = mobile.LoadChartsData(userValidator, Widget, ReportPage, FilterData, ObjectId, Code, UnitFilterDataJson, ReportSource, isDesign);

            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 简易看板获取加载数据
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        [WebMethod(Description = "简易看板获取加载数据")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = false)]
        public void LoadSimpleBoard(string userCode, string mobileToken, string FilterData, string WidgetObjectId, string ReportPageObjectId, string ReportWidgetSimpleBoardObjectId, string UnitFilterDataJson, string WidgetSimpleBoard)
        {
            UserValidator userValidator = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidator == null) return;
            MobileReportAccess mobile = new MobileReportAccess();
            string ReportWidgetSimpleBoard = "";
            string ReportPage = "";
            string ReportSource = "";
            var result = mobile.LoadSimpleBoard(userValidator, WidgetSimpleBoard, ReportPage, FilterData, ReportWidgetSimpleBoard, WidgetObjectId, ReportPageObjectId, ReportWidgetSimpleBoardObjectId, ReportSource, UnitFilterDataJson);

            ResponseJSON(JSSerializer.Serialize(result));
        }
        #endregion

        #region ==>应用中心

        /// <summary>
        /// 获取应用中心列表
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        [WebMethod(Description = "获取应用中心列表")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetAppList(string userCode, string mobileToken, string AppCode)
        {
            UserValidator userValidator = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidator == null) return;

            MobileAccess mobile = new MobileAccess();
            var result = string.IsNullOrEmpty(AppCode) ? mobile.MobileFetchAllApps(userValidator) : mobile.MobileGetApps(userValidator, AppCode);
            if (result == null) return;

            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 获取应用列表
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        /// <param name="parentId"></param>
        [WebMethod(Description = "获取获取应用列表")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetFunctions(string userCode, string mobileToken, string AppCode)
        {
            UserValidator userValidator = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidator == null) return;

            MobileAccess mobile = new MobileAccess();
            var result = mobile.MobileFetchFunction(userValidator, AppCode);
            if (result == null) return;

            ResponseJSON(JSSerializer.Serialize(result));
        }


        #endregion

        /// <summary>
        /// 获取指定父ID的直属子组织和用户
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        /// <param name="parentId"></param>
        [WebMethod(Description = "加载直接下级组织")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void SearchUser(string userCode, string mobileToken, string parentId, string searchKey)
        {
            UserValidator userValidator = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidator == null) return;

            MobileAccess mobile = new MobileAccess();
            var result = mobile.SearchUserFn(userCode, mobileToken, parentId, searchKey);
            if (result == null) return;

            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 获取指定父ID的直属子组织和用户
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        /// <param name="parentId"></param>
        [WebMethod(Description = "加载直接下级组织")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetOrganizationByParent(string userCode, string mobileToken, string parentId)
        {
            UserValidator userValidator = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidator == null) return;

            MobileAccess mobile = new MobileAccess();
            var result = mobile.GetOrganizationByParentFn(userValidator, userCode, mobileToken, parentId);
            if (result == null) return;

            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 获取用户信息
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        /// <param name="targetUserId"></param>
        [WebMethod(Description = "获取用户信息")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetUserByObjectID(string userCode, string mobileToken, string targetUserId)
        {
            UserValidator sourceUser = ValidateUserMobileToken(userCode, mobileToken);
            if (sourceUser == null) return;

            OThinker.Organization.User user = this.Engine.Organization.GetUnit(targetUserId) as OThinker.Organization.User;
            if (user == null) return;

            UserValidator userValidator = UserValidatorFactory.GetUserValidator(this.Engine, user.Code);
            MobileAccess mobile = new MobileAccess();
            MobileAccess.MobileUser mobileUser = mobile.GetMobileUser(sourceUser, user, user.ImageUrl, userValidator.DepartmentName, string.Empty);
            var result = new
            {
                MobileUser = mobileUser
            };
            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 设置流程是否常用
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="mobileToken"></param>
        /// <param name="workflowCode"></param>
        /// <param name="isFavorite"></param>
        [WebMethod(Description = "设置流程是否常用")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void SetFavorite(string userId, string mobileToken, string workflowCode, bool isFavorite)
        {
            if (!ValidateMobileToken(userId, mobileToken)) return;

            if (isFavorite)
            {
                this.Engine.WorkflowConfigManager.AddFavoriteWorkflow(userId, workflowCode);
            }
            else
            {
                this.Engine.WorkflowConfigManager.DeleteFavoriteWorkflow(userId, workflowCode);
            }
            ActionResult result = new ActionResult(true);
            ResponseJSON(JSSerializer.Serialize(result));
        }

        /// <summary>
        /// 加载流程模板信息
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        [WebMethod(Description = "获取用户可以发起的流程")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void LoadWorkflows(string userCode, string mobileToken)
        {
            UserValidator userValidate = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidate == null)
            {
                throw new Exception("用户不存在");
            }

            MobileAccess mobile = new MobileAccess();
            var result = mobile.LoadWorkflowsFn(userValidate);
            if (result == null) return;
            ResponseJSON(JSSerializer.Serialize(result));
        }


        /// <summary>
        /// 修改密码
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        [WebMethod(Description = "修改密码")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void SetPassword(string userCode, string mobileToken, string oldPassword, string newPassword)
        {
            oldPassword = HttpUtility.UrlDecode(oldPassword).Replace("_38;_", "&");
            newPassword = HttpUtility.UrlDecode(newPassword).Replace("_38;_", "&");
            ActionResult result = new ActionResult(true);
            UserValidator userValidate = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidate == null)
            {
                result.Success = false;
                result.Message = "用户不存在";
            }
            else
            {
                MobileAccess mobile = new MobileAccess();
                result = mobile.SetPasswordFn(userCode, oldPassword, newPassword);
            }
            ResponseJSON(JSSerializer.Serialize(result));
        }

        #region ==>查询列表
        /// <summary>
        /// 查询列表
        /// </summary>
        /// <param name="userCode"></param>
        /// <param name="mobileToken"></param>
        [WebMethod(Description = "查询列表")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetQuerySettingAndData(
            string userCode,
            string mobileToken,
            int sEcho,
            int iDisplayStart,
            int iDisplayLength,
            string schemaCode,
            string queryCode,
            string filterStr,
            string InputMapping
            )
        {
            ActionResult result = new ActionResult(true);
            UserValidator userValidate = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidate == null)
            {
                result.Success = false;
                result.Message = "用户不存在";
            }
            else
            {
                int totalCount;
                OThinker.H3.DataModel.BizObjectSchema schema = this.Engine.BizObjectManager.GetPublishedSchema(schemaCode);
                DataModel.BizQuery Query = Engine.BizObjectManager.GetBizQuery(queryCode);
                if (string.IsNullOrEmpty(filterStr)) { filterStr = "{}"; }
                MobileAccess mobile = new MobileAccess();
                mobile._UserValidator = userValidate;
                int pageIndex = iDisplayStart / iDisplayLength + 1; ;
                int pageSize = iDisplayLength;
                List<object> dataList = mobile.GetGridDataList(schema, sEcho, Query, filterStr, pageSize, pageIndex, InputMapping, out totalCount);
                OThinker.H3.Controllers.ViewModels.GridViewModel<object> json = new OThinker.H3.Controllers.ViewModels.GridViewModel<object>(totalCount, dataList, sEcho);
                //第一次加载需加载配置信息
                if (sEcho == 1)
                {
                    OThinker.H3.Sheet.BizSheet[] sheets = this.Engine.BizSheetManager.GetBizSheetBySchemaCode(schemaCode);
                    Dictionary<string, object> param = new Dictionary<string, object>();
                    param["ActionFilter"] = mobile.GetRunBizQueryData(schema, Query);
                    param["DisplayFormats"] = mobile.GetDisplayFormats(Query);
                    param["HasSheet"] = sheets != null && sheets.Length > 0;
                    json.Extend = param;
                }

                ResponseJSON(JSSerializer.Serialize(json));
            }
            ResponseJSON(JSSerializer.Serialize(result));
        }

        #endregion

        #region 门户首页------------------------------------------------

        /// <summary>
        /// 底部菜单待办待阅数量
        /// </summary>
        /// <returns></returns>
        [WebMethod(Description = "底部菜单待办待阅数量")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetWorkItemCount(string userId, string mobileToken)
        {
            if (!ValidateMobileToken(userId, mobileToken)) { return; }

            ActionResult result = new ActionResult(true);
            MobileAccess mobile = new MobileAccess();
            result.Extend = mobile.GetWorkItemCountCommon(userId);
            ResponseJSON(JSSerializer.Serialize(result));
        }

        [WebMethod(Description = "获取数据模型数据")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void GetDataModelData(string userId, string DataModelCode, string QueryCode, string SortBy, int FromRowNum, int ShowCount)
        {
            ActionResult result = new ActionResult(true);
            MobileAccess mobile = new MobileAccess();
            result.Extend = mobile.GetDataModelDataFn(userId, DataModelCode, QueryCode, SortBy, FromRowNum, ShowCount);
            ResponseJSON(JSSerializer.Serialize(result));
        }
        #endregion

        [WebMethod(Description = "获取数据模型链接")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void EditBizObjectSheet(
            string userCode,
            string mobileToken,
            string BizObjectID,
            string SchemaCode,
            string SheetCode,
            string Mode,
            bool IsMobile,
            string EditInstanceData)
        {
            ActionResult result = new ActionResult(false, "");
            MobileAccess mobile = new MobileAccess();
            UserValidator userValidator = ValidateUserMobileToken(userCode, mobileToken);
            mobile._UserValidator = userValidator;
            string url = string.Empty;
            SheetMode SheetMode = SheetMode.Work;
            SheetMode = (SheetMode)Enum.Parse(typeof(SheetMode), Mode);
            if (mobile.ValidateAuthorization(BizObjectID, SchemaCode, SheetMode, SchemaCode) == OThinker.Data.BoolMatchValue.False)
            {
                result.Success = false;
                result.Message = Configs.Global.ResourceManager.GetString("MvcController_Perission");
                ResponseJSON(JSSerializer.Serialize(result));
            }
            else
            {
                if (!string.IsNullOrEmpty(EditInstanceData))
                {
                    url = mobile.GetWorkSheetUrl(
                            SchemaCode,
                            BizObjectID,
                            SheetMode,
                            IsMobile);
                    url += "&EditInstanceData=true";
                }
                else
                {
                    Sheet.BizSheet sheet = this.Engine.BizSheetManager.GetBizSheetByCode(SheetCode);
                    if (sheet == null)
                    {
                        // 兼容旧版本
                        OThinker.H3.Sheet.BizSheet[] sheets = this.Engine.BizSheetManager.GetBizSheetBySchemaCode(SchemaCode);
                        if (sheets == null || sheets.Length == 0)
                        {
                            throw new Exception("流程包{" + SchemaCode + "}表单不存在，请检查。");
                        }
                        sheet = sheets[0];
                    }
                    url = mobile.GetWorkSheetUrl(
                            SchemaCode,
                            BizObjectID,
                            sheet,
                            SheetMode,
                            IsMobile);
                }
                result.Message = url;
                result.Success = true;
                ResponseJSON(JSSerializer.Serialize(result));
            }
        }


        /// <summary>
        /// 获取所有可发起的流程模板
        /// </summary>
        /// <param name="Mode"></param>
        /// <param name="ShowFavorite"></param>
        /// <param name="IsMobile"></param>
        /// <param name="IsShared"></param>
        /// <param name="ParentCode"></param>
        /// <param name="SearchKey"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取所有可发起的流程模板")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void QueryWorkflowNodes(string userCode,
            string Mode = "WorkflowTemplate",
            bool ShowFavorite = true,
            bool IsMobile = false,
            bool IsShared = false,
            string ParentCode = "",
            string SearchKey = "",
            bool Isbilingual = false,
            bool IsAsync = false)
        {
            UserValidator userValidator = UserValidatorFactory.GetUserValidator(this.Engine, userCode);
            //获取所有有权限发起的流程模板
            DataTable dtworkflows = Engine.PortalQuery.QueryWorkflow(userValidator.RecursiveMemberOfs, userValidator.ValidateAdministrator());
            //根据可以发起的流程模板编码，倒推获取所有的节点集合
            List<string> aclWorkflowCodes = new List<string>();
            foreach (DataRow row in dtworkflows.Rows)
            {
                if (aclWorkflowCodes.Contains(row[WorkItem.WorkItem.PropertyName_WorkflowCode])) continue;
                if (IsShared && (row[OThinker.H3.WorkflowTemplate.WorkflowClause.PropertyName_IsShared] + string.Empty) != "1") continue;
                aclWorkflowCodes.Add(row[WorkItem.WorkItem.PropertyName_WorkflowCode] + string.Empty);
            }
            //FunctionAclManager
            List<OThinker.H3.Acl.FunctionNode> nodes = this.Engine.WorkflowManager.GetParentNodesByWorkflowCodes(aclWorkflowCodes);
            if (nodes != null) nodes = nodes.OrderBy(s => s.DisplayName).OrderBy(s => s.SortKey).ToList();
            //获取所有的流程模板头，用于获取发布时间
            //WorkflowTemplateManager
            Dictionary<string, OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader> dicHeaders = this.Engine.WorkflowManager.GetDefaultWorkflowHeaders(aclWorkflowCodes.ToArray());
            List<OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader> headers = new List<OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader>();
            //移动端可发起的流程编码
            List<string> mobileVisibleWorkflowCodes = new List<string>();
            //图标集<WorkflowCode.ImagePath>
            Dictionary<string, string> workflowIcons = new Dictionary<string, string>();
            Dictionary<string, string> workflowIconFileNames = new Dictionary<string, string>();

            if (IsMobile)
            {
                #region 手机端 --------------
                // 检测是否允许手机端发起
                List<string> lstSchemaCodes = new List<string>();
                foreach (OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader header in dicHeaders.Values)
                {
                    if (!lstSchemaCodes.Contains(header.BizObjectSchemaCode.ToLower()))
                    {
                        lstSchemaCodes.Add(header.BizObjectSchemaCode.ToLower());
                    }
                }

                Dictionary<string, OThinker.H3.WorkflowTemplate.WorkflowClause[]> dicClauses = this.Engine.WorkflowManager.GetClausesBySchemaCodes(lstSchemaCodes.ToArray());

                foreach (string key in dicClauses.Keys)
                {
                    foreach (OThinker.H3.WorkflowTemplate.WorkflowClause c in dicClauses[key])
                    {
                        if (c.MobileStart && !mobileVisibleWorkflowCodes.Contains(c.WorkflowCode.ToLower()))
                        {
                            mobileVisibleWorkflowCodes.Add(c.WorkflowCode.ToLower());
                            if (!string.IsNullOrEmpty(c.IconFileName))
                            {
                                workflowIconFileNames.Add(c.WorkflowCode.ToLower(), c.IconFileName);
                            }
                            else if (!string.IsNullOrEmpty(c.Icon))
                            {
                                workflowIcons.Add(c.WorkflowCode.ToLower(), c.Icon);
                            }
                        }
                    }
                }
                #endregion
            }

            foreach (OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader header in dicHeaders.Values)
            {
                if (!IsMobile || mobileVisibleWorkflowCodes.Contains(header.WorkflowCode.ToLower()))
                {
                    headers.Add(header);
                }
            }

            List<string> favoriteWorkflowCodes = this.Engine.WorkflowConfigManager.GetFavoriteWorkflowCodes(userValidator.UserID);

            string parentCode = string.IsNullOrEmpty(ParentCode) ? OThinker.H3.Acl.FunctionNode.Category_ProcessModel_Code : ParentCode;
            if (Mode != "WorkflowTemplate")
            { // 如果是数据模型
                List<OThinker.H3.Acl.FunctionNode> bizObjectNodes = null;
                if (parentCode == OThinker.H3.Acl.FunctionNode.Category_ProcessModel_Code)
                {
                    bizObjectNodes = this.Engine.FunctionAclManager.GetChildNodesByParentCode(OThinker.H3.Acl.FunctionNode.ProcessModel_BizMasterData_Code);
                    if (bizObjectNodes != null && bizObjectNodes.Count > 0)
                    {
                        bizObjectNodes.Add(new OThinker.H3.Acl.FunctionNode()
                        {
                            Code = OThinker.H3.Acl.FunctionNode.ProcessModel_BizMasterData_Code,
                            ParentCode = OThinker.H3.Acl.FunctionNode.Category_ProcessModel_Code,
                            NodeType = OThinker.H3.Acl.FunctionNodeType.BizFolder,
                            SortKey = -1,
                            DisplayName = "主数据"
                        });
                    }
                }
                else
                {
                    bizObjectNodes = this.Engine.FunctionAclManager.GetChildNodesByParentCode(parentCode);
                }
                if (bizObjectNodes != null) nodes.AddRange(bizObjectNodes);
            }
            MobileAccess mobile = new MobileAccess();
            List<OThinker.H3.Controllers.ViewModels.WorkflowNode> result = mobile.GetWorkflowNodeByParentCode(
                parentCode,
                SearchKey,
                Mode == "WorkflowTemplate" ? OThinker.H3.Acl.FunctionNodeType.BizWorkflow : OThinker.H3.Acl.FunctionNodeType.BizWorkflowPackage,
                ShowFavorite,
                nodes,
                favoriteWorkflowCodes,
                aclWorkflowCodes,
                headers,
                workflowIcons,
                workflowIconFileNames,
                IsShared,
                Isbilingual,
                (string.IsNullOrEmpty(SearchKey) ? IsAsync : false));
            ResponseJSON(JSSerializer.Serialize(result));
        }


        /// <summary>
        /// 加载组织机构树  
        /// </summary>
        [WebMethod(Description = "加载组织机构树")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void LoadOrgTreeNodes(
            string OrgPostCode,
            string UserCodes,
            string SearchKey,
            string ParentID,
            string o,
            string VisibleUnits,
            string V,
            string RootUnitID,
            bool IsMobile,
            bool LoadTree,
            bool Recursive,
            string userCode,
            string mobileToken)
        {
            MobileAccess mobile = new MobileAccess();
            List<OThinker.H3.Controllers.ViewModels.PortalTreeNode> results;
            bool orgUnitVisible = false;
            bool userVisible = false;
            bool groupVisible = false;

            UserValidator sourceUser = ValidateUserMobileToken(userCode, mobileToken);
            string visibleUnitstr = string.IsNullOrEmpty(VisibleUnits + string.Empty) ? (V + string.Empty) : (VisibleUnits + string.Empty);
            string[] visibleUnits = visibleUnitstr.Split(new string[] { ";", "," }, StringSplitOptions.RemoveEmptyEntries);

            orgUnitVisible = (o + string.Empty).IndexOf('O') > -1;
            userVisible = (o + string.Empty).IndexOf('U') > -1;
            groupVisible = (o + string.Empty).IndexOf('G') > -1;


            if (string.IsNullOrEmpty(ParentID))
            {
                ParentID = RootUnitID + string.Empty;
                if (visibleUnits.Length == 1)
                { // 只有1个可见的组织单元，则以该组织单元为顶点显示
                    ParentID = visibleUnits[0];
                }

                if (ParentID == string.Empty)
                {
                    ParentID = this.Engine.Organization.RootUnit.ObjectID;
                }
                //else if (ParentID.ToLower() == "{current}" || ParentID.ToLower() == "current")
                //{
                //    ParentID = this.UserValidator.User.ParentID;
                //}
            }
            if (!string.IsNullOrEmpty(OrgPostCode))
            { // 显示指定角色的用户
                results = mobile.LoadNodesByPostCode(OrgPostCode);
                ResponseJSON(JSSerializer.Serialize(results));
            }
            else if (!string.IsNullOrEmpty(UserCodes))
            { // 显示指定帐号的用户集合
                results = mobile.LoadNodesByUserCodes(UserCodes);
                ResponseJSON(JSSerializer.Serialize(results));
            }
            else
            {
                if (SearchKey != string.Empty && !LoadTree)
                {// 搜索用户
                    results = mobile.SearchUser(SearchKey, ParentID, orgUnitVisible, userVisible);
                    ResponseJSON(JSSerializer.Serialize(results));
                }
                else
                {
                    var ParentUnit = this.Engine.Organization.GetUnit(ParentID);
                    OThinker.H3.Controllers.ViewModels.PortalTreeNode treeNode = mobile.GetTreeNodeFromUnit(ParentUnit);
                    mobile.LoadChildrenNodes(treeNode, LoadTree, IsMobile, userVisible, groupVisible, orgUnitVisible, visibleUnits, sourceUser);
                    if (Recursive)
                    {
                        ResponseJSON(JSSerializer.Serialize(new OThinker.H3.Controllers.ViewModels.PortalTreeNode[1] { treeNode }));
                    }
                    else
                    {
                        ResponseJSON(JSSerializer.Serialize(treeNode.children));
                    }
                }
            }
        }

        [WebMethod(Description = "变更系统语言")]
        [ScriptMethod(ResponseFormat = ResponseFormat.Json, UseHttpGet = true)]
        public void SetLanguage(string userCode, string mobileToken, string languageKey)
        {
            bool flag = false;
            UserValidator userValidator = ValidateUserMobileToken(userCode, mobileToken);
            if (userValidator != null)
            {
                MobileAccess mobile = new MobileAccess();
                flag = mobile.SetLanguage(userValidator,languageKey);
            }
            ActionResult result = new ActionResult(flag);
            ResponseJSON(JSSerializer.Serialize(result));
        }
    }
}