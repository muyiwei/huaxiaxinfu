<%@ WebService Language="C#" Class="OThinker.H3.Portal.BPMService" %>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Services;
using System.Data;
using OThinker.H3.Acl;
using OThinker.H3.WorkflowTemplate;

namespace OThinker.H3.Portal
{
    /// <summary>
    /// 流程实例操作相关接口
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.None)]
    //若要允许使用 ASP.NET AJAX 从脚本中调用此 Web 服务，请取消对下行的注释。 
    // [System.Web.Script.Services.ScriptService]
    public class BPMService : System.Web.Services.WebService
    {
        /// <summary>
        /// 
        /// </summary>
        public BPMService()
        {
            //如果使用设计的组件，请取消注释以下行 
            //InitializeComponent(); 
        }

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

        /// <summary>
        /// 查询对象
        /// </summary>
        protected Query Query
        {
            get
            {
                return this.Engine.Query;
            }
        }

        private System.Web.Script.Serialization.JavaScriptSerializer _JsSerializer = null;
        /// <summary>
        /// 获取JS序列化对象
        /// </summary>
        private System.Web.Script.Serialization.JavaScriptSerializer JSSerializer
        {
            get
            {
                if (_JsSerializer == null)
                {
                    _JsSerializer = new System.Web.Script.Serialization.JavaScriptSerializer();
                }
                return _JsSerializer;
            }
        }

        /// <summary>
        /// 获取2个日期之间的总天数
        /// </summary>
        /// <param name="StartDate"></param>
        /// <param name="EndDate"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取2个日期之间的天数")]
        public double GetDays(DateTime StartDate, DateTime EndDate)
        {
            bool existsDefault = this.Engine.WorkingCalendarManager.ExistsDefaultCalendar();
            if (existsDefault)
            {
                TimeSpan span = this.Engine.WorkingCalendarManager.GetUsedTimeByCompanyCalendar(StartDate, EndDate);
                return span.TotalHours / 8;
            }
            return EndDate.Subtract(StartDate).Days;
        }

        [WebMethod(Description = "获取发起流程模板")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public string GetWorkfowNodeByUser(string UserCode,
            bool ShowFavorite = true,
            bool IsMobile = false,
            string ParentCode = "",
            string SearchKey = "")
        {
            ValidateSoapHeader();

            string Mode = "WorkflowTemplate";

            var CurrentUserValidator = OThinker.H3.Controllers.UserValidatorFactory.GetUserValidator(this.Engine, UserCode);
            if (CurrentUserValidator == null) { return null; }

            OThinker.H3.Controllers.WorkflowController workflowCtrl = new Controllers.WorkflowController();

            //获取所有有权限发起的流程模板
            DataTable dtworkflows = Engine.PortalQuery.QueryWorkflow(CurrentUserValidator.RecursiveMemberOfs, CurrentUserValidator.ValidateAdministrator());
            //根据可以发起的流程模板编码，倒推获取所有的节点集合
            List<string> aclWorkflowCodes = new List<string>();
            foreach (DataRow row in dtworkflows.Rows)
            {
                if (aclWorkflowCodes.Contains(row[WorkItem.WorkItem.PropertyName_WorkflowCode].ToString())) continue;
                aclWorkflowCodes.Add(row[WorkItem.WorkItem.PropertyName_WorkflowCode] + string.Empty);
            }
            //FunctionAclManager
            List<FunctionNode> nodes = Engine.WorkflowManager.GetParentNodesByWorkflowCodes(aclWorkflowCodes);
            //获取所有的流程模板头，用于获取发布时间
            //WorkflowTemplateManager
            Dictionary<string, PublishedWorkflowTemplateHeader> dicHeaders = Engine.WorkflowManager.GetDefaultWorkflowHeaders(aclWorkflowCodes.ToArray());
            List<PublishedWorkflowTemplateHeader> headers = new List<PublishedWorkflowTemplateHeader>();
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
                foreach (PublishedWorkflowTemplateHeader header in dicHeaders.Values)
                {
                    if (!lstSchemaCodes.Contains(header.BizObjectSchemaCode.ToLower()))
                    {
                        lstSchemaCodes.Add(header.BizObjectSchemaCode.ToLower());
                    }
                }
                Dictionary<string, WorkflowClause[]> dicClauses = this.Engine.WorkflowManager.GetClausesBySchemaCodes(lstSchemaCodes.ToArray());
                foreach (string key in dicClauses.Keys)
                {
                    foreach (WorkflowClause c in dicClauses[key])
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

            foreach (PublishedWorkflowTemplateHeader header in dicHeaders.Values)
            {
                if (!IsMobile || mobileVisibleWorkflowCodes.Contains(header.WorkflowCode.ToLower()))
                {
                    headers.Add(header);
                }
            }
            //常用流程
            List<string> favoriteWorkflowCodes = this.Engine.WorkflowConfigManager.GetFavoriteWorkflowCodes(CurrentUserValidator.UserID);
            string parentCode = string.IsNullOrEmpty(ParentCode) ? OThinker.H3.Acl.FunctionNode.Category_ProcessModel_Code : ParentCode;
            var result = workflowCtrl.GetWorkflowNodeByParentCode(
                parentCode,
                SearchKey,
                Mode == "WorkflowTemplate" ? FunctionNodeType.BizWorkflow : FunctionNodeType.BizWorkflowPackage,
                ShowFavorite,
                nodes,
                favoriteWorkflowCodes,
                aclWorkflowCodes,
                headers,
                workflowIcons,
                workflowIconFileNames);

            return JSSerializer.Serialize(result);

        }

        /// <summary>
        /// 获取用户的待办任务总数
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取用户未完成的任务总数")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public int GetUserUnfinishedWorkItemCount(string userId)
        {
            try
            {
                ValidateSoapHeader();
                int recordCounts;
                // 构造查询用户帐号的条件
                string[] conditions = Query.GetWorkItemConditions(
                    userId,
                    true,
                    H3.WorkItem.WorkItemState.Unfinished,
                    H3.WorkItem.WorkItemType.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified);

                // 获取总记录数，计算页码         
                recordCounts = this.Engine.Query.CountWorkItem(conditions);
                return recordCounts;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 获取用户的已办任务总数
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取用户已完成的任务总数")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public int GetUserFinishedWorkItemCount(string userId)
        {
            try
            {
                ValidateSoapHeader();
                int recordCounts;
                // 构造查询用户帐号的条件
                string[] conditions = Query.GetWorkItemConditions(
                    userId,
                    true,
                    H3.WorkItem.WorkItemState.Finished,
                    H3.WorkItem.WorkItemType.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified);
                // 获取总记录数，计算页码
                recordCounts = this.Engine.PortalQuery.CountWorkItem(conditions, OThinker.H3.WorkItem.WorkItemFinished.TableName);
                return recordCounts;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 获取用户的待阅任务总数
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取用户待阅任务总数")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public int GetUserUnReadWorkItemCount(string userId)
        {
            try
            {
                ValidateSoapHeader();
                int recordCounts;
                // 构造查询用户帐号的条件
                string[] conditions = Query.GetWorkItemConditions(
                    userId,
                    true,
                    H3.WorkItem.WorkItemState.UnRead,
                    H3.WorkItem.WorkItemType.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified);

                // 获取总记录数     
                recordCounts = this.Engine.PortalQuery.CountWorkItem(conditions, OThinker.H3.WorkItem.CirculateItem.TableName);
                return recordCounts;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 获取用户的已阅任务总数
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取用户已阅任务总数")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public int GetUserReadedWorkItemCount(string userId)
        {
            try
            {
                ValidateSoapHeader();
                int recordCounts;
                // 构造查询用户帐号的条件
                //Query.get
                string[] conditions = Query.GetWorkItemConditions(
                    userId,
                    true,
                    H3.WorkItem.WorkItemState.Read,
                    H3.WorkItem.WorkItemType.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified);

                // 获取总记录数       
                recordCounts = this.Engine.PortalQuery.CountWorkItem(conditions, OThinker.H3.WorkItem.CirculateItemFinished.TableName);
                return recordCounts;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        // <summary>
        /// 查询用户的已办
        /// </summary>
        /// <param name="userCode">用户编码</param>
        /// <param name="startTime">开始时间（可控）</param>
        /// <param name="endTime">结束时间</param>
        /// <param name="startIndex">开始索引</param>
        /// <param name="endIndex">结束索引</param>
        /// <param name="workflowCode">流程编码</param>
        /// <param name="instanceName">流程实例名称</param>
        /// <returns></returns>
        [WebMethod(Description = "查询用户的已办")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public List<Controllers.ViewModels.WorkItemViewModel> GetFinishWorkItems(string userCode, DateTime? startTime, DateTime? endTime, int startIndex, int endIndex, string workflowCode, string instanceName)
        {
            ValidateSoapHeader();
            List<Controllers.ViewModels.WorkItemViewModel> listItems = new List<Controllers.ViewModels.WorkItemViewModel>();
            OThinker.Organization.User user = this.Engine.Organization.GetUserByCode(userCode);
            if (user == null) return listItems;

            string[] conditions = Engine.PortalQuery.GetWorkItemConditions(user.ObjectID,
                    startTime == null ? DateTime.MinValue : startTime.Value,
                    endTime == null ? DateTime.MaxValue : endTime.Value.AddDays(1),
                    WorkItem.WorkItemState.Finished,
                    instanceName,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    workflowCode,
                    true,
                    WorkItem.WorkItemFinished.TableName);
            string OrderBy = "ORDER BY " +
                 WorkItem.WorkItemFinished.TableName + "." + WorkItem.WorkItemFinished.PropertyName_ReceiveTime + " DESC";
            DataTable dtWorkitem = Engine.PortalQuery.QueryWorkItem(conditions, startIndex, endIndex, OrderBy, WorkItem.WorkItemFinished.TableName);
            //int total = Engine.PortalQuery.CountWorkItem(conditions, WorkItem.WorkItemFinished.TableName); // 记录总数
            string[] columns = new string[] { WorkItem.WorkItemFinished.PropertyName_OrgUnit };

            Controllers.WorkItemController controller = new Controllers.WorkItemController();
            List<Controllers.ViewModels.WorkItemViewModel> griddata = controller.Getgriddata(dtWorkitem, columns);

            return griddata;
        }

        // <summary>
        /// 查询用户的待办
        /// </summary>
        /// <param name="userCode">用户编码</param>
        /// <param name="startTime">开始时间（可控）</param>
        /// <param name="endTime">结束时间</param>
        /// <param name="startIndex">开始索引</param>
        /// <param name="endIndex">结束索引</param>
        /// <param name="workflowCode">流程编码</param>
        /// <param name="instanceName">流程实例名称</param>
        /// <returns></returns>
        [WebMethod(Description = "查询用户的待办")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public List<Controllers.ViewModels.WorkItemViewModel> GetUnFinishWorkItems(string userCode, DateTime? startTime, DateTime? endTime, int startIndex, int endIndex, string workflowCode, string instanceName)
        {
            ValidateSoapHeader();
            List<Controllers.ViewModels.WorkItemViewModel> listItems = new List<Controllers.ViewModels.WorkItemViewModel>();
            OThinker.Organization.User user = this.Engine.Organization.GetUserByCode(userCode);
            if (user == null) return listItems;

            string[] conditions = Engine.PortalQuery.GetWorkItemConditions(user.ObjectID,
                    startTime == null ? DateTime.MinValue : startTime.Value,
                    endTime == null ? DateTime.MaxValue : endTime.Value.AddDays(1),
                    WorkItem.WorkItemState.Unfinished,
                    instanceName,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    workflowCode,
                    true,
                    WorkItem.WorkItem.TableName);
            string OrderBy = "ORDER BY " +
                 WorkItem.WorkItem.TableName + "." + WorkItem.WorkItem.PropertyName_ReceiveTime + " DESC";
            DataTable dtWorkitem = Engine.PortalQuery.QueryWorkItem(conditions, startIndex, endIndex, OrderBy, WorkItem.WorkItem.TableName);
            //int total = Engine.PortalQuery.CountWorkItem(conditions, WorkItem.WorkItemFinished.TableName); // 记录总数
            string[] columns = new string[] { WorkItem.WorkItem.PropertyName_OrgUnit };

            Controllers.WorkItemController controller = new Controllers.WorkItemController();
            List<Controllers.ViewModels.WorkItemViewModel> griddata = controller.Getgriddata(dtWorkitem, columns);

            return griddata;
        }


        /// <summary>
        /// 查询用户的已阅任务
        /// </summary>
        /// <param name="userCode">用户编码</param>
        /// <param name="startTime">开始时间（可控）</param>
        /// <param name="endTime">结束时间</param>
        /// <param name="startIndex">开始索引</param>
        /// <param name="endIndex">结束索引</param>
        /// <param name="workflowCode">流程编码</param>
        /// <param name="instanceName">流程实例名称</param>
        /// <returns></returns>
        [WebMethod(Description = "查询用户的已阅任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public List<Controllers.ViewModels.CirculateItemViewModel> GetReadWorkItems(string userCode, DateTime? startTime, DateTime? endTime, int startIndex, int endIndex, string workflowCode, string instanceName)
        {

            ValidateSoapHeader();
            List<Controllers.ViewModels.CirculateItemViewModel> listItems = new List<Controllers.ViewModels.CirculateItemViewModel>();
            OThinker.Organization.User user = this.Engine.Organization.GetUserByCode(userCode);
            if (user == null) return listItems;
            string[] conditions = Engine.PortalQuery.GetWorkItemConditions(user.ObjectID,
                    startTime == null ? DateTime.MinValue : startTime.Value,
                    endTime == null ? DateTime.MaxValue : endTime.Value.AddDays(1),
                    WorkItem.WorkItemState.Finished,
                    instanceName,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    workflowCode,
                    false,
                    WorkItem.CirculateItemFinished.TableName);
            DataTable dtWorkitem = Engine.PortalQuery.QueryWorkItem(conditions, startIndex, endIndex, string.Empty, WorkItem.CirculateItemFinished.TableName);

            int total = Engine.PortalQuery.CountWorkItem(conditions, WorkItem.CirculateItemFinished.TableName); // 记录总数
            string[] columns = new string[] { WorkItem.CirculateItemFinished.PropertyName_OrgUnit, Query.ColumnName_OriginateUnit };

            Controllers.CirculateItemController controller = new Controllers.CirculateItemController();
            listItems = controller.Getgriddata(dtWorkitem, columns, false);
            return listItems;

        }


        /// <summary>
        /// 查询用户的待阅任务
        /// </summary>
        /// <param name="userCode">用户编码</param>
        /// <param name="startTime">开始时间（可控）</param>
        /// <param name="endTime">结束时间</param>
        /// <param name="startIndex">开始索引</param>
        /// <param name="endIndex">结束索引</param>
        /// <param name="workflowCode">流程编码</param>
        /// <param name="instanceName">流程实例名称</param>
        /// <returns></returns>
        [WebMethod(Description = "查询用户的待阅任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public List<Controllers.ViewModels.CirculateItemViewModel> GetUnReadWorkItems(string userCode, DateTime? startTime, DateTime? endTime, int startIndex, int endIndex, string workflowCode, string instanceName)
        {
            ValidateSoapHeader();
            List<Controllers.ViewModels.CirculateItemViewModel> listItems = new List<Controllers.ViewModels.CirculateItemViewModel>();
            OThinker.Organization.User user = this.Engine.Organization.GetUserByCode(userCode);
            if (user == null) return listItems;
            string[] conditions = Engine.PortalQuery.GetWorkItemConditions(user.ObjectID,
                    startTime == null ? DateTime.MinValue : startTime.Value,
                    endTime == null ? DateTime.MaxValue : endTime.Value.AddDays(1),
                    WorkItem.WorkItemState.Unfinished,
                    instanceName,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    workflowCode,
                    false,
                    WorkItem.CirculateItem.TableName);
            DataTable dtWorkitem = Engine.PortalQuery.QueryWorkItem(conditions, startIndex, endIndex, string.Empty, WorkItem.CirculateItem.TableName);

            //int total = Engine.PortalQuery.CountWorkItem(conditions, WorkItem.CirculateItem.TableName); // 记录总数
            string[] columns = new string[] { WorkItem.CirculateItem.PropertyName_OrgUnit, Query.ColumnName_OriginateUnit };

            Controllers.CirculateItemController controller = new Controllers.CirculateItemController();
            listItems = controller.Getgriddata(dtWorkitem, columns, false);
            return listItems;
        }

        /// <summary>
        /// 获取待办任务信息
        /// </summary>
        /// <param name="workItemId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取待办任务信息")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public WorkItem.WorkItem GetWorkItem(string workItemId)
        {
            ValidateSoapHeader();
            WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            return item;
        }

        /// <summary>
        /// 获取业务数据的值
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="itemName"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取业务数据集合")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public object GetBizObject(string workItemId, string itemName)
        {
            ValidateSoapHeader();
            WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            Instance.InstanceContext context = this.Engine.InstanceManager.GetInstanceContext(item.InstanceId);
            OThinker.H3.DataModel.BizObjectSchema schema = this.Engine.BizObjectManager.GetPublishedSchema(item.InstanceId);
            OThinker.H3.DataModel.BizObject bo = new DataModel.BizObject(this.Engine, schema, context.Originator);
            bo.ObjectID = context.BizObjectId;
            bo.Load();
            return bo[itemName];
        }

        /// <summary>
        /// 获取传阅任务信息
        /// </summary>
        /// <param name="circulateItemId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取待办任务信息")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public WorkItem.CirculateItem GetCirculateItem(string circulateItemId)
        {
            ValidateSoapHeader();
            WorkItem.CirculateItem item = this.Engine.WorkItemManager.GetCirculateItem(circulateItemId);
            return item;
        }

        [WebMethod(Description = "获取待办任务信息")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public OThinker.H3.Instance.InstanceContext GetInstanceContext(string instanceId)
        {
            ValidateSoapHeader();
            OThinker.H3.Instance.InstanceContext context = this.Engine.InstanceManager.GetInstanceContext(instanceId);
            return context;
        }

        /// <summary>
        /// 提交(已阅)工作任务
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <returns></returns>
        [WebMethod(Description = "提交(已阅)工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool SubmitWorkItem(string workItemId, string commentText)
        {
            return this.SubmitWorkItemWithParamValues(workItemId, commentText, null);
        }

        /// <summary>
        /// 提交(已阅)工作任务
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <param name="paramValues"></param>
        /// <returns></returns>
        [WebMethod(Description = "提交(已阅)工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool SubmitWorkItemWithParamValues(string workItemId, string commentText, List<DataItemParam> paramValues)
        {
            ValidateSoapHeader();
            WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            SubmitItem(workItemId, OThinker.Data.BoolMatchValue.True, commentText, OThinker.Organization.User.AdministratorID, paramValues);//UserValidator.UserID);
            return true;
        }

        /// <summary>
        /// 驳回工作任务
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <returns></returns>
        [WebMethod(Description = "驳回工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ReturnWorkItem(string userId, string workItemId, string commentText)
        {
            return ReturnWorkItemWithParamValues(userId, workItemId, commentText, null);
        }

        /// <summary>
        /// 驳回工作任务
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <returns></returns>
        [WebMethod(Description = "驳回工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ReturnWorkItemWithParamValues(string userId, string workItemId, string commentText, List<DataItemParam> paramValues)
        {
            ValidateSoapHeader();
            // 获取操作的用户

            WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            //手工节点不允许驳回
            if (item != null && item.ItemType == WorkItem.WorkItemType.Fill) return false;
            return ReturnItem(userId, workItemId, commentText, paramValues,null);

        }


        /// <summary>
        /// 驳回工作任务到指定节点
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <returns></returns>
        [WebMethod(Description = "驳回工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ReturnWorkItemToActivity(string userId, string workItemId, string commentText, string activityCode)
        {
            return ReturnWorkItemWithParamValuesToActivity(userId, workItemId, commentText, null, activityCode);
        }

        /// <summary>
        /// 驳回工作任务到指定节点
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <returns></returns>
        [WebMethod(Description = "驳回工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ReturnWorkItemWithParamValuesToActivity(string userId, string workItemId, string commentText, List<DataItemParam> paramValues, string activityCode)
        {
            ValidateSoapHeader();
            // 获取操作的用户

            WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            //手工节点不允许驳回
            if (item != null && item.ItemType == WorkItem.WorkItemType.Fill) return false;
            return ReturnItem(userId, workItemId, commentText, paramValues, activityCode);

        }

        /// <summary>
        /// 结束流程
        /// </summary>
        /// <param name="instanceId">流程实例ID</param>
        /// <returns></returns>
        [WebMethod(Description = "强制结束流程")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool FinishInstance(string instanceId)
        {
            ValidateSoapHeader();
            // 获取操作的用户

            Instance.InstanceContext context = this.Engine.InstanceManager.GetInstanceContext(instanceId);
            if (context == null) return false;

            WorkflowTemplate.PublishedWorkflowTemplate workflow = this.Engine.WorkflowManager.GetDefaultWorkflow(context.WorkflowCode);

            Messages.ActivateActivityMessage activateMessage = new Messages.ActivateActivityMessage(
                    Messages.MessageEmergencyType.High,
                    instanceId,
                    workflow.EndActivityCode,
                    OThinker.H3.Instance.Token.UnspecifiedID,
                    null,
                    null,
                    false,
                    WorkItem.ActionEventType.Adjust
                );
            this.Engine.InstanceManager.SendMessage(activateMessage);
            return true;
        }

        /// <summary>
        /// 激活流程
        /// </summary>
        /// <param name="instanceId">流程实例ID</param>
        /// <returns></returns>
        [WebMethod(Description = "激活流程")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ActiveInstance(string instanceId)
        {
            ValidateSoapHeader();
            // 获取操作的用户

            OThinker.H3.Messages.ActivateInstanceMessage activateMessage = new OThinker.H3.Messages.ActivateInstanceMessage(instanceId);
            this.Engine.InstanceManager.SendMessage(activateMessage);

            return true;
        }

        /// <summary>
        /// 激活指定的活动节点
        /// </summary>
        /// <param name="instanceId">流程实例ID</param>
        /// <param name="activityCode">活动节点</param>
        /// <param name="participants">活动参与者,可以指定参与者，如果为空那么取流程默认配置</param>
        /// <returns></returns>
        [WebMethod(Description = "激活指定的活动节点")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ActiveToken(string instanceId, string activityCode, string[] participants)
        {
            try
            {
                ValidateSoapHeader();

                // 准备触发后面Activity的消息
                OThinker.H3.Messages.ActivateActivityMessage activateMessage
                    = new OThinker.H3.Messages.ActivateActivityMessage(
                        OThinker.H3.Messages.MessageEmergencyType.Normal,
                        instanceId,
                        activityCode,
                        OThinker.H3.Instance.Token.UnspecifiedID,
                        participants,
                        null,
                        false,
                        H3.WorkItem.ActionEventType.Adjust);
                this.Engine.InstanceManager.SendMessage(activateMessage);
                return true;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 取消指定的活动节点
        /// </summary>
        /// <param name="instanceId">流程实例ID</param>
        /// <param name="activityCode">活动节点</param>
        /// <returns></returns>
        [WebMethod(Description = "取消指定的活动节点")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool CancelToken(string instanceId, string activityCode)
        {
            try
            {
                ValidateSoapHeader();

                // 准备触发后面Activity的消息
                OThinker.H3.Messages.CancelActivityMessage cancelMessage
                    = new Messages.CancelActivityMessage(Messages.MessageEmergencyType.Normal,
                        instanceId,
                        activityCode,
                        false);
                this.Engine.InstanceManager.SendMessage(cancelMessage);
                return true;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 取回工作任务
        /// </summary>
        /// <param name="workitemId">工作任务ID</param>
        /// <returns></returns>
        [WebMethod(Description = "取回工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool RetrieveWorkItem(string userId, string workitemId)
        {
            try
            {
                ValidateSoapHeader();

                //获取工作项信息
                OThinker.H3.WorkItem.WorkItem workItem = this.Engine.WorkItemManager.GetWorkItem(workitemId);
                OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate workflow = this.Engine.WorkflowManager.GetPublishedTemplate(workItem.WorkflowCode, workItem.WorkflowVersion);
                // 检查是否能够取回
                if (workItem == null) return false;
                OThinker.H3.Instance.InstanceContext context = this.Engine.InstanceManager.GetInstanceContext(workItem.InstanceId);
                // 获得当前的Token是否存在多个分支
                OThinker.H3.Instance.IToken currentToken = context.GetToken(workItem.TokenId);
                if (currentToken == null) return false;

                int postTokenId = 0;
                string activity = "";
                if (!GetPostTokenId(context, workflow, workItem.TokenId, ref postTokenId, ref activity))
                {
                    return false;
                }

                OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader worflowTemplate = this.Engine.WorkflowManager.GetPublishedTemplateHeader(workItem.WorkflowCode, workItem.WorkflowVersion);

                // 记录操作用户ID 
                OThinker.H3.Tracking.UserLog log = new OThinker.H3.Tracking.UserLog(
                    Tracking.UserLogType.Retrieve,
                    userId,
                    "",
                    worflowTemplate.BizObjectSchemaCode,
                    workItem.InstanceId,
                    workItem.WorkItemID,
                    workItem.DisplayName,
                    null,
                    null,
                    null,
                    null);
                this.Engine.UserLogWriter.Write(log);

                // 发送取回消息
                OThinker.H3.Messages.CancelActivityMessage rollback
                        = new OThinker.H3.Messages.CancelActivityMessage(
                            OThinker.H3.Messages.MessageEmergencyType.Normal,
                            workItem.InstanceId,
                            activity,
                            true);
                this.Engine.InstanceManager.SendMessage(rollback);

                return true;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 获取后置的路由TOKEN
        /// </summary>
        /// <param name="context">流程实例上下文</param>
        /// <param name="workflow">流程模型</param>
        /// <param name="curTokenId">当前的TokenId</param>
        /// <param name="postTokenId">下一活动的TokenId</param>
        /// <param name="activity">下以活动的ActivityCode</param>
        /// <returns>true:可以取回;false:不可取回</returns>
        private bool GetPostTokenId(OThinker.H3.Instance.InstanceContext context,
            OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate workflow,
            int curTokenId, ref int postTokenId, ref string activity)
        {

            // 获得后继的Token
            int[] postTokenIds = context.GetPostTokens(curTokenId, OThinker.H3.Instance.TokenState.Undropped);
            //判断后继任务是否可以取回
            if (postTokenIds == null || postTokenIds.Length == 0)
            {// 已经取回过了

                return false;
            }

            if (postTokenIds.Length > 1)
            {// 后继活动是发散活动
                return false;
            }
            else
            {
                postTokenId = postTokenIds[0];
                OThinker.H3.Instance.IToken postToken = context.GetToken(postTokenId);
                if (!workflow.GetActivityByCode(postToken.Activity).IsClient)
                {
                    // 具备取回的条件
                    return GetPostTokenId(context, workflow, postTokenId, ref postTokenId, ref activity);
                }
                else if (!postToken.Retrievable)
                {
                    // 无法取回
                    return false;
                }
                activity = postToken.Activity;
                return true;
            }

        }
        /// <summary>
        /// 启动H3流程实例，设置主键数据项的值(私有云接口)
        /// </summary>
        /// <param name="workflowCode"></param>
        /// <param name="userAlias"></param>
        /// <param name="finishStart"></param>
        /// <param name="keyName"></param>
        /// <param name="keyValue"></param>
        /// <returns></returns>
        [WebMethod(Description = "启动H3流程实例，设置主键数据项的值")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public BPMServiceResult StartWorkflowWithKey(
            string workflowCode,
            string userCode,
            bool finishStart,
            string keyName,
            string keyValue)
        {
            ValidateSoapHeader();
            List<DataItemParam> paramValues = new List<DataItemParam>();
            if (!string.IsNullOrEmpty(keyName))
            {
                paramValues.Add(new DataItemParam()
                {
                    ItemName = keyName,
                    ItemValue = keyValue
                });
            }

            return startWorkflow(workflowCode, userCode, finishStart, paramValues);
        }

        /// <summary>
        /// 启动H3流程实例
        /// </summary>
        /// <param name="workflowCode">流程模板编码</param>
        /// <param name="userCode">启动流程的用户编码</param>
        /// <param name="finishStart">是否结束第一个活动</param>
        /// <param name="paramValues">流程实例启动初始化数据项集合</param>
        /// <returns></returns>
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        [WebMethod(Description = "启动H3流程实例")]
        public BPMServiceResult StartWorkflow(
            string workflowCode,
            string userCode,
            bool finishStart,
            List<DataItemParam> paramValues)
        {
            try
            {
                ValidateSoapHeader();
                return startWorkflow(workflowCode, userCode, finishStart, paramValues);
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 设置单个流程数据项的值
        /// </summary>
        /// <param name="bizObjectSchemaCode"></param>
        /// <param name="bizObjectId"></param>
        /// <param name="keyName"></param>
        /// <param name="keyValue"></param>
        /// <returns></returns>
        [WebMethod(Description = "设置单个流程数据项的值")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool SetItemValue(string userId, string bizObjectSchemaCode, string bizObjectId, string keyName, object keyValue)
        {
            try
            {
                ValidateSoapHeader();
                List<DataItemParam> keyValues = new List<DataItemParam>();
                keyValues.Add(new DataItemParam()
                {
                    ItemName = keyName,
                    ItemValue = keyValue
                });
                return SetItemValues(userId, bizObjectSchemaCode, bizObjectId, keyValues);
            }
            catch (AuthenticationException ex)
            {
                throw ex;
            }
        }

        /// <summary>
        /// 设置批量流程数据项的值
        /// </summary>
        /// <param name="bizObjectSchemaCode"></param>
        /// <param name="bizObjectId"></param>
        /// <param name="keyValues"></param>
        /// <returns></returns>
        [WebMethod(Description = "设置批量流程数据项的值")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool SetItemValues(string userId, string bizObjectSchemaCode, string bizObjectId, List<DataItemParam> keyValues)
        {
            try
            {
                string userID = userId;
                ValidateSoapHeader();
                // 获取操作的用户
                if (keyValues == null || keyValues.Count == 0) return false;
                Dictionary<string, object> values = new Dictionary<string, object>();
                foreach (DataItemParam param in keyValues)
                {
                    values.Add(param.ItemName, param.ItemValue);
                } return this.Engine.BizObjectManager.SetPropertyValues(bizObjectSchemaCode, bizObjectId, userID, values);
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 输出日志至引擎服务器
        /// </summary>
        /// <param name="message"></param>
        [WebMethod(Description = "输出日志至引擎服务器")]
        public void WriteLog(string message)
        {
            this.Engine.LogWriter.Write(message);
        }

        #region 工作任务私有方法 ----------------
        /// <summary>
        /// 提交工作项
        /// </summary>
        /// <param name="workItemId">工作项ID</param>
        /// <param name="approval">审批结果</param>
        /// <param name="commentText">审批意见</param>
        /// <param name="userId">处理人</param>
        private void SubmitItem(string workItemId, OThinker.Data.BoolMatchValue approval, string commentText, string userId, List<DataItemParam> paramValues)
        {
            // 获取工作项
            OThinker.H3.WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            OThinker.H3.Instance.InstanceContext instance = this.Engine.InstanceManager.GetInstanceContext(item.InstanceId);
            // 添加意见
            this.AppendComment(instance, item, OThinker.Data.BoolMatchValue.True, commentText);
            // 保存表单数据
            this.SaveBizObject(userId, instance, paramValues);

            //结束工作项
            this.Engine.WorkItemManager.FinishWorkItem(
                item.ObjectID,
                userId,
                OThinker.H3.WorkItem.AccessPoint.ExternalSystem,
                null,
                approval,
                commentText,
                null,
                OThinker.H3.WorkItem.ActionEventType.Forward,
                (int)OThinker.H3.Controllers.SheetButtonType.Submit);

            // 需要通知实例事件管理器结束事件
            Messages.AsyncEndMessage endMessage = new OThinker.H3.Messages.AsyncEndMessage(
                    Messages.MessageEmergencyType.Normal,
                    item.InstanceId,
                    item.ActivityCode,
                    item.TokenId,
                    approval,
                    false,
                    approval,
                    true,
                    null);
            this.Engine.InstanceManager.SendMessage(endMessage);
        }

        /// <summary>
        /// 保存表单数据
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="context"></param>
        /// <param name="paramValues"></param>
        private void SaveBizObject(string userId, Instance.InstanceContext context, List<DataItemParam> paramValues)
        {
            // 保存表单数据
            if (paramValues != null && paramValues.Count > 0)
            {
                OThinker.H3.DataModel.BizObjectSchema schema = this.Engine.BizObjectManager.GetPublishedSchema(context.BizObjectSchemaCode);
                OThinker.H3.DataModel.BizObject bo = new DataModel.BizObject(this.Engine, schema, userId);
                bo.ObjectID = context.ObjectID;

                // 这里可以在创建流程的时候赋值
                foreach (DataItemParam param in paramValues)
                {
                    this.SetDataItemValue(bo, param);
                }
                bo.Update();
            }
        }

        /// <summary>
        /// 设置数据项的值
        /// </summary>
        /// <param name="bo"></param>
        /// <param name="param"></param>
        private void SetDataItemValue(OThinker.H3.DataModel.BizObject bo, DataItemParam param)
        {
            if (bo.Schema.ContainsField(param.ItemName))
            {
                OThinker.H3.DataModel.PropertySchema property = bo.Schema.GetProperty(param.ItemName);
                if (property.LogicType == Data.DataLogicType.ShortString
                    || property.LogicType == Data.DataLogicType.String
                    || property.LogicType == Data.DataLogicType.DateTime
                    || property.LogicType == Data.DataLogicType.Decimal
                    || property.LogicType == Data.DataLogicType.Double
                    || property.LogicType == Data.DataLogicType.Int
                    || property.LogicType == Data.DataLogicType.Html
                    || property.LogicType == Data.DataLogicType.Long)
                {
                    bo[param.ItemName] = param.ItemValue;
                }
                else if (property.LogicType == Data.DataLogicType.SingleParticipant)
                {
                    string userId = param.ItemValue + string.Empty;
                    if (userId.Length == 36) { bo[param.ItemName] = userId; }
                    else
                    {
                        Organization.User user = this.Engine.Organization.GetUserByCode(userId);
                        if (user != null) bo[param.ItemName] = user.ObjectID;
                    }
                }
                else if (property.LogicType == Data.DataLogicType.MultiParticipant)
                {
                    try
                    {
                        string[] userIds = param.ItemValue as string[];
                        if (userIds != null)
                        {
                            List<string> uesrValues = new List<string>();
                            foreach (string userId in userIds)
                            {
                                if (userId.Length == 36) { uesrValues.Add(userId); }
                                else
                                {
                                    Organization.User user = this.Engine.Organization.GetUserByCode(userId);
                                    if (user != null) uesrValues.Add(user.ObjectID);
                                }
                            }
                            bo[param.ItemName] = userIds.ToArray();
                        }
                    }
                    catch (Exception ex) { this.Engine.LogWriter.Write("SetItemValue->" + ex.ToString()); }
                }
            }
        }

        /// <summary>
        /// 驳回工作任务
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <param name="paramValues"></param>
        /// <returns></returns>
        private bool ReturnItem(string userId, string workItemId, string commentText, List<DataItemParam> paramValues, string activityCode)
        {
            Organization.User user = this.Engine.Organization.GetUnit(userId) as Organization.User;
            if (user == null) return false;
            // 获取工作项
            OThinker.H3.WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            OThinker.H3.Instance.InstanceContext context = this.Engine.InstanceManager.GetInstanceContext(item.InstanceId);
            OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate workflow = this.Engine.WorkflowManager.GetPublishedTemplate(item.WorkflowCode, item.WorkflowVersion);

            string activityName = activityCode;
            if (string.IsNullOrEmpty(activityName))
            {
                // 获取上一个提交过来的活动节点
                H3.Instance.IToken preToken = this.GetPreToken(item.TokenId, item, context, workflow);
                //判断上一个节点是否是连接点节点,是连接点则继续向前寻找
                if (preToken == null) return false;
                activityName = preToken.Activity;

            }
            // 添加意见
            this.AppendComment(context, item, OThinker.Data.BoolMatchValue.False, commentText);
            // 保存表单数据
            this.SaveBizObject(userId, context, paramValues);

            // 结束工作项
            this.Engine.WorkItemManager.FinishWorkItem(
                  item.ObjectID,
                  user.ObjectID,
                  H3.WorkItem.AccessPoint.ExternalSystem,

                  null,
                  OThinker.Data.BoolMatchValue.False,
                  commentText,
                  null,
                  H3.WorkItem.ActionEventType.Backward,
                  (int)OThinker.H3.Controllers.SheetButtonType.Return);
            // 准备触发后面Activity的消息
            OThinker.H3.Messages.ActivateActivityMessage activateMessage
                = new OThinker.H3.Messages.ActivateActivityMessage(
                OThinker.H3.Messages.MessageEmergencyType.Normal,
                item.InstanceId,
                activityName,
                OThinker.H3.Instance.Token.UnspecifiedID,
                null,
                new int[] { item.TokenId },
                false,
                H3.WorkItem.ActionEventType.Backward);

            // 通知该Activity已经完成
            OThinker.H3.Messages.AsyncEndMessage endMessage =
                new OThinker.H3.Messages.AsyncEndMessage(
                    OThinker.H3.Messages.MessageEmergencyType.Normal,
                    item.InstanceId,
                    item.ActivityCode,
                    item.TokenId,
                    OThinker.Data.BoolMatchValue.False,
                    true,
                    OThinker.Data.BoolMatchValue.False,
                    false,
                    activateMessage);
            this.Engine.InstanceManager.SendMessage(endMessage);
            return true;
        }

        #region 获取前一个活动
        /// <summary>
        /// 获取前一个活动
        /// </summary>
        /// <param name="TokenId"></param>
        /// <returns></returns>
        private OThinker.H3.Instance.IToken GetPreToken(int TokenId, OThinker.H3.WorkItem.WorkItem item, OThinker.H3.Instance.InstanceContext context, OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate workflow)
        {
            // 通过日志获得当前步骤令牌
            H3.Instance.IToken token = context.GetToken(TokenId);
            H3.Instance.IToken preToken = GetPreToken(token, item, context, workflow);
            if (preToken != null)
            {
                Activity preActivity = workflow.GetActivityByCode(preToken.Activity);
                if (preActivity.ActivityType == ActivityType.FillSheet
                    || preActivity.ActivityType == ActivityType.Approve
                    || preActivity.ActivityType == ActivityType.SubInstance)
                {
                    return preToken;
                }
                else
                {
                    return GetPreToken(preToken.TokenId, item, context, workflow);
                }
            }

            // 继续检测该活动的历史活动，直到找到最近的一次提交源为止
            H3.Instance.IToken[] historyTokens = context.GetTokens(item.ActivityCode, H3.Instance.TokenState.Finished);
            if (historyTokens != null)
            {
                foreach (H3.Instance.IToken historyToken in historyTokens)
                {
                    preToken = this.GetPreToken(historyToken, item, context, workflow);
                    if (preToken != null) return preToken;
                }
            }
            return null;
        }

        /// <summary>
        /// 获取某个活动的前驱活动
        /// </summary>
        /// <param name="Token"></param>
        /// <returns></returns>
        private OThinker.H3.Instance.IToken GetPreToken(H3.Instance.IToken Token, OThinker.H3.WorkItem.WorkItem item, OThinker.H3.Instance.InstanceContext context, OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate workflow)
        {
            if (Token == null || Token.PreTokens == null || Token.PreTokens.Length != 1) return null;
            int preTokenId = Token.PreTokens[0];
            H3.Instance.IToken preToken = context.GetToken(preTokenId);
            if (preToken.Activity == item.ActivityCode)
            {// 前一个活动的节点就是本节点，禁止打回
                return null;
            }
            //前一个活动是连接点的话,需要继续向前寻找活动
            Activity preActivity = workflow.GetActivityByCode(preToken.Activity);
            if (preActivity.ActivityType == ActivityType.Connection)
            {
                return GetPreToken(preToken, item, context, workflow);
            }
            if (preToken.Approval != OThinker.Data.BoolMatchValue.False)
            {// 前一个活动是提交，则返回当前活动
                return preToken;
            }
            return null;
        }
        #endregion
        private BPMServiceResult startWorkflow(
            string workflowCode,
            string userCode,
            bool finishStart,
            List<DataItemParam> paramValues)
        {
            ValidateSoapHeader();
            string workItemID, keyItem, errorMessage;
            workItemID = keyItem = errorMessage = string.Empty;
            BPMServiceResult result;

            try
            {
                // 获取模板
                OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader workflowTemplate = GetWorkflowTemplate(workflowCode);
                if (workflowTemplate == null)
                {
                    result = new BPMServiceResult(false, "流程启动失败,流程模板不存在，模板编码:" + workflowCode + "。");
                    return result;
                }
                // 查找流程发起人
                OThinker.Organization.User user = this.Engine.Organization.GetUserByCode(userCode) as Organization.User;
                if (user == null)
                {
                    result = new BPMServiceResult(false, "流程启动失败,用户{" + userCode + "}不存在。");
                    return result;
                }

                OThinker.H3.DataModel.BizObjectSchema schema = this.Engine.BizObjectManager.GetPublishedSchema(workflowTemplate.BizObjectSchemaCode);
                OThinker.H3.DataModel.BizObject bo = new DataModel.BizObject(
                    this.Engine.Organization,
                    this.Engine.MetadataRepository,
                    this.Engine.BizObjectManager,
                    this.Engine.BizBus,
                    schema,
                    OThinker.Organization.User.AdministratorID,
                    OThinker.Organization.OrganizationUnit.DefaultRootID);

                if (paramValues != null)
                {
                    // 这里可以在创建流程的时候赋值
                    foreach (DataItemParam param in paramValues)
                    {
                        this.SetDataItemValue(bo, param);
                    }
                }

                bo.Create();

                // 创建流程实例
                string InstanceId = this.Engine.InstanceManager.CreateInstance(
                     bo.ObjectID,
                     workflowTemplate.WorkflowCode,
                     workflowTemplate.WorkflowVersion,
                     null,
                     null,
                     user.UnitID,
                     null,
                     false,
                     Instance.InstanceContext.UnspecifiedID,
                     null,
                     Instance.Token.UnspecifiedID);

                // 设置紧急程度为普通
                OThinker.H3.Messages.MessageEmergencyType emergency = Messages.MessageEmergencyType.Normal;
                // 这里也可以在启动流程的时候赋值
                Dictionary<string, object> paramTables = new Dictionary<string, object>();

                // 启动流程的消息
                OThinker.H3.Messages.StartInstanceMessage startInstanceMessage
                    = new OThinker.H3.Messages.StartInstanceMessage(
                        emergency,
                        InstanceId,
                        null,
                        paramTables,
                        Instance.PriorityType.Normal,
                        true,
                        null,
                        false,
                        OThinker.H3.Instance.Token.UnspecifiedID,
                        null);
                Engine.InstanceManager.SendMessage(startInstanceMessage);
                result = new BPMServiceResult(true, InstanceId, workItemID, "流程实例启动成功！", "");
            }
            catch (Exception ex)
            {
                result = new BPMServiceResult(false, "流程实例启动失败！错误：" + ex.ToString());
            }
            return result;
        }

        /// <summary>
        /// 给工作项添加审批意见
        /// </summary>
        /// <param name="item">工作项</param>
        /// <param name="approval">审批结果</param>
        /// <param name="commentText">审批意见</param>
        private void AppendComment(OThinker.H3.Instance.InstanceContext Instance, OThinker.H3.WorkItem.WorkItem item, OThinker.Data.BoolMatchValue approval, string commentText)
        {
            // 添加一个审批意见
            WorkflowTemplate.PublishedWorkflowTemplate workflow = this.Engine.WorkflowManager.GetPublishedTemplate(
                item.WorkflowCode,
                item.WorkflowVersion);
            // 审批字段
            string approvalDataItem = null;
            if (workflow != null)
            {
                OThinker.H3.DataModel.BizObjectSchema schema = this.Engine.BizObjectManager.GetPublishedSchema(item.WorkflowCode);
                approvalDataItem = workflow.GetDefaultCommentDataItem(schema, item.ActivityCode);
            }
            if (approvalDataItem != null)
            {
                // 创建审批
                OThinker.H3.Data.Comment comment = new Data.Comment();
                comment.Activity = item.ActivityCode;
                comment.Approval = approval;
                comment.CreatedTime = System.DateTime.Now;
                comment.DataField = approvalDataItem;
                comment.InstanceId = item.InstanceId;
                comment.BizObjectId = Instance.BizObjectId;
                comment.BizObjectSchemaCode = Instance.BizObjectSchemaCode;
                comment.OUName = this.Engine.Organization.GetName(this.Engine.Organization.GetParent(item.Participant));
                comment.Text = commentText;
                comment.TokenId = item.TokenId;
                comment.UserID = item.Participant;
                comment.UserName = this.Engine.Organization.GetName(item.Participant);


                // 设置用户的默认签章
                Organization.Signature[] signs = this.Engine.Organization.GetSignaturesByUnit(item.Participant);
                if (signs != null && signs.Length > 0)
                {
                    foreach (Organization.Signature sign in signs)
                    {
                        if (sign.IsDefault)
                        {
                            comment.SignatureId = sign.ObjectID;
                            break;
                        }
                    }
                }
                this.Engine.BizObjectManager.AddComment(comment);
            }
        }
        #endregion

        /// <summary>
        /// 获取最新的流程模板
        /// </summary>
        /// <param name="workflowCode">流程模板编码</param>
        /// <returns></returns>
        private OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader GetWorkflowTemplate(string workflowCode)
        {
            // 获取最新版本号
            int workflowVersion = this.Engine.WorkflowManager.GetWorkflowDefaultVersion(workflowCode);
            return GetWorkflowTemplate(workflowCode, workflowVersion);
        }

        /// <summary>
        /// 获取指定版本号的流程模板对象
        /// </summary>
        /// <param name="workflowCode">流程模板编码</param>
        /// <param name="workflowVersion">流程模板版本号</param>
        /// <returns></returns>
        private OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader GetWorkflowTemplate(string workflowCode, int workflowVersion)
        {
            // 获取模板
            OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader workflowTemplate = this.Engine.WorkflowManager.GetPublishedTemplateHeader(
                    workflowCode,
                    workflowVersion);
            return workflowTemplate;
        }

        public Authentication authentication;
        // public OThinker.H3.Controllers.UserValidator UserValidator = null;

        /// <summary>
        /// 验证当前用户是否正确
        /// </summary>
        /// <returns></returns>
        public void ValidateSoapHeader()
        {
            if (authentication == null)
            {
                throw new AuthenticationException("请输入身份认证信息!", null);
            }
            bool result = this.Engine.SSOManager.ValidateSSOSystem(authentication.SystemCode, authentication.Secret);
            if (!result)
            {
                throw new AuthenticationException("帐号或密码不正确!", null);
            }
            // this.Engine = UserValidator.Engine;
            // this.Engine = OThinker.H3.WorkSheet.AppUtility.Engine;
        }
    }


    public class Employee
    {
        public Employee() { }
        public Employee(string UserCode, string Password)
        {
            this.UserCode = UserCode;
            this.Password = Password;
        }

        public string UserCode { get; set; }
        public string Password { get; set; }
    }

    /// <summary>
    /// 身份验证类
    /// </summary>
    public class Authentication : System.Web.Services.Protocols.SoapHeader
    {
        public Authentication() { }

        /// <summary>
        /// SOAPHeader，验证
        /// </summary>
        /// <param name="SystemCode"></param>
        /// <param name="Secret"></param>
        public Authentication(string SystemCode, string Secret)
        {
            this.SystemCode = SystemCode;
            this.Secret = Secret;
        }

        public string SystemCode { get; set; }
        public string Secret { get; set; }
    }

    /// <summary>
    /// 流程服务返回消息类
    /// </summary>
    public class BPMServiceResult
    {
        /// <summary>
        /// 消息类构造函数
        /// </summary>
        /// <param name="success"></param>
        /// <param name="instanceId"></param>
        /// <param name="workItemId"></param>
        /// <param name="message"></param>
        public BPMServiceResult(bool success, string instanceId, string workItemId, string message, string WorkItemUrl)
        {
            this.Success = success;
            this.InstanceID = instanceId;
            this.Message = message;
            this.WorkItemID = workItemId;
            this.WorkItemUrl = WorkItemUrl;
        }

        /// <summary>
        /// 消息类构造函数
        /// </summary>
        /// <param name="success"></param>
        /// <param name="message"></param>
        public BPMServiceResult(bool success, string message)
            : this(success, string.Empty, string.Empty, message, string.Empty)
        {

        }

        public BPMServiceResult() { }

        private bool success = false;
        /// <summary>
        /// 获取或设置流程启动是否成功
        /// </summary>
        public bool Success
        {
            get { return success; }
            set { success = value; }
        }
        private string instanceId = string.Empty;
        /// <summary>
        /// 获取或设置启动的流程实例ID
        /// </summary>
        public string InstanceID
        {
            get { return instanceId; }
            set { this.instanceId = value; }
        }
        private string message = string.Empty;
        /// <summary>
        /// 获取或设置系统返回消息
        /// </summary>
        public string Message
        {
            get { return message; }
            set { this.message = value; }
        }
        private string workItemId = string.Empty;
        /// <summary>
        /// 获取或设置第一个节点的ItemID
        /// </summary>
        public string WorkItemID
        {
            get { return workItemId; }
            set { this.workItemId = value; }
        }
        private string workItemUrl = string.Empty;
        /// <summary>
        /// 获取或设置第一个节点的url
        /// </summary>
        public string WorkItemUrl
        {
            get { return workItemUrl; }
            set { this.workItemUrl = value; }
        }
    }

    /// <summary>
    /// 提交任务后返回对象
    /// </summary>
    [Serializable]
    public class ReturnWorkItemInfo
    {
        public ReturnWorkItemInfo() { }
        private bool isSuccess = false;
        /// <summary>
        /// 是否提交成功
        /// </summary>
        public bool IsSuccess
        {
            get { return isSuccess; }
            set { this.isSuccess = value; }
        }
        private string workItemUrl = string.Empty;
        /// <summary>
        /// 当前表单地址
        /// </summary>
        public string WorkItemUrl
        {
            get { return workItemUrl; }
            set { this.workItemUrl = value; }
        }
    }

    /// <summary>
    /// 数据项参数
    /// </summary>
    [Serializable]
    public class DataItemParam
    {
        private string itemName = string.Empty;
        /// <summary>
        /// 获取或设置数据项名称
        /// </summary>
        public string ItemName
        {
            get { return itemName; }
            set { this.itemName = value; }
        }

        private object itemValue = string.Empty;
        /// <summary>
        /// 获取或设置数据项的值
        /// </summary>
        public object ItemValue
        {
            get { return itemValue; }
            set { this.itemValue = value; }
        }
    }
    [Serializable]
    public class AuthenticationException : ApplicationException
    {
        public AuthenticationException()
        { }

        public AuthenticationException(string message)
            : base(message)
        {
        }
        public AuthenticationException(string message, Exception inner)
            : base(message, inner)
        { }
    }

}