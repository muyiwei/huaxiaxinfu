using OThinker.H3.BizBus.BizService;
using OThinker.H3.BizBus.Filter;
using OThinker.H3.Controllers;
using OThinker.H3.Data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace OThinker.H3.Portal
{
    /// <summary>
    /// 
    /// </summary>
    public partial class AjaxServices : Page
    {
        /// <summary>
        /// 页面加载时，获取指令，输出相应的结果
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                string cmd = Request["cmd"];   // 指令参数 cmd
                Response.Clear();
                switch (cmd)
                {
                    case "LoadWorkflowName":
                        GetWorkflowNames();  // 获取选择用户信息
                        break;
                    case "LoadDataItems":
                        GetDataItems();
                        break;
                    case "LoadActivityList":
                        LoadActivityList();
                        break;
                    case "GetUnitsType":
                        GetUnitType();
                        break;
                    case "GetUser":
                        GetUserInfo();
                        break;
                    case "GetLinkageData":
                        GetLinkageData();
                        break;
                    case "GetFunctionNames":
                        GetFunctionNames();
                        break;
                    case "GetFormatValue":
                        GetFormatValue();
                        break;
                    case "ExecuteServiceMethod":
                        ExecuteServiceMethod();
                        break;
                    default: break;
                }
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

        #region 实现方法 ---------------
        /// <summary>
        /// 获取数据的格式化后字符
        /// </summary>
        protected void GetFormatValue()
        {
            string format = Request["Format"];

            decimal inputValue = 0m;
            decimal.TryParse(Request["InputValue"] + string.Empty, out inputValue);

            Response.Clear();
            Response.Write(string.Format(format, inputValue));
            Response.Buffer = true;
        }

        /// <summary>
        /// 获取流程显示名称
        /// </summary>
        protected void GetWorkflowNames()
        {
            //string package = Request["Package"] + string.Empty;
            //List<WorkflowTemplate.PublishedWorkflowTemplate> templates = this.Engine.WorkflowPackageManager.GetPublishTemplateByPackageCode(package);
            ////WorkflowTemplate.WorkflowClause[] clauses = this.Engine.WorkflowManager.GetClauses(
            //            //package,
            //            //OThinker.H3.WorkflowTemplate.WorkflowState.Active);
            //string results = string.Empty;
            //for (int i = 0; i < clauses.Length; i++)
            //{
            //    results += results == string.Empty ? string.Empty : ",";
            //    results += clauses[i].DisplayName2;
            //}

            //Response.Clear();
            //Response.Write(results.ToString());
            //Response.Buffer = true;
        }

        /// <summary>
        /// 获取数据项
        /// </summary>
        public void GetDataItems()
        {
            //string workflowPackage, workflowName;
            //workflowPackage = Request["PackageName"];
            //workflowName = Request["WorkflowName"];
            //Data.ClauseDataItem[] items = this.Engine.ClauseDataManager.GetColumns(workflowPackage, workflowName);
            //StringBuilder builder = new StringBuilder();
            //builder.Append("({Items:[");
            //int index = 0;
            //foreach (ClauseDataItem item in items)
            //{
            //    if (index > 0) builder.Append(",");
            //    builder.Append("{\"ColumnName\":\"" + item.ColumnName + "\",\"Countable\":\"" + item.Countable + "\",\"LogicTypeName\":\"" + item.LogicTypeName + "\"}");
            //    index++;
            //}
            //builder.Append("]})");
            //Response.Clear();
            //Response.Write(builder.ToString());
            //Response.Buffer = true;
        }

        /// <summary>
        /// 执行业务服务方法
        /// </summary>
        protected void ExecuteServiceMethod()
        {
            string serviceCode, methodName;
            serviceCode = Request["ServiceCode"];
            methodName = Request["MethodName"];
            // 获得方法的定义
            MethodSchema method = AppUtility.Engine.BizBus.GetMethod(serviceCode, methodName);
            if (method == null)
            {
                return;
            }
            // 删除与组织结构对应的系统权限
            OThinker.H3.BizBus.BizService.BizStructure param = null;
            if (method.ParamSchema != null)
            {
                param = H3.BizBus.BizService.BizStructureUtility.Create(method.ParamSchema);
                if (method.ParamSchema.Items != null)
                {
                    foreach (ItemSchema item in method.ParamSchema.Items)
                    {
                        // 转换成相应的类型
                        object obj = null;
                        if (!OThinker.Data.Convertor.Convert(
                             Request[item.Name],
                             item.RealType,
                             ref obj))
                        {
                            Response.Write(string.Format("属性{0}的类型转换错误{1}", item.Name, item.RealType));
                        }
                        param[item.Name] = obj;
                    }
                }
            }

            // 调用方法
            OThinker.H3.BizBus.BizService.BizStructure ret = null;
            try
            {
                ret = AppUtility.Engine.BizBus.Invoke(
                     new BizBus.BizService.BizServiceInvokingContext(
                         UserValidatorFactory.CurrentUser != null ? UserValidatorFactory.CurrentUser.UserID : string.Empty,
                         serviceCode,
                         method.ServiceVersion,
                         method.MethodName,
                         param));
            }
            catch (Exception ex)
            {
                Response.Write(string.Format("系统出现异常->{0}", ex.ToString()));
            }
            if (ret != null && ret.Schema != null)
            {
                Dictionary<string, object> result = new Dictionary<string, object>();
                foreach (OThinker.H3.BizBus.BizService.ItemSchema item in ret.Schema.Items)
                {
                    if (item.LogicType == DataLogicType.BizStructure)
                    {
                        result.Add(item.Name, LoadBizStructure(ret[item.Name] as BizStructure));
                    }
                    else if (item.LogicType == DataLogicType.BizStructureArray)
                    {
                        result.Add(item.Name, LoadBizStructureArray(ret[item.Name]));
                    }
                    else
                    {
                        result.Add(item.Name, ret[item.Name]);
                    }
                }
                Response.Clear();
                Response.Write(Newtonsoft.Json.JsonConvert.SerializeObject(result));
                // Response.Write(JSSerializer.Serialize(result));
                Response.Buffer = true;
            }
        }

        private List<Dictionary<string, object>> LoadBizStructureArray(object source)
        {
            OThinker.H3.BizBus.BizService.BizStructure[] bizStructures = source as OThinker.H3.BizBus.BizService.BizStructure[];
            if (bizStructures == null) return null;

            List<Dictionary<string, object>> res = new List<Dictionary<string, object>>();
            foreach (OThinker.H3.BizBus.BizService.BizStructure bizStructure in bizStructures)
            {
                Dictionary<string, object> structure = LoadBizStructure(bizStructure);
                if (structure != null)
                {
                    res.Add(structure);
                }
            }
            return res;
        }

        private Dictionary<string, object> LoadBizStructure(BizStructure bizStructure)
        {
            if (bizStructure == null) return null;

            Dictionary<string, object> structure = new Dictionary<string, object>();
            foreach (ItemSchema item in bizStructure.Schema.Items)
            {
                structure.Add(item.Name, bizStructure[item.Name]);
            }
            return structure;
        }

        /// <summary>
        /// 获取所有活动名称
        /// </summary>
        private void LoadActivityList()
        {
            string workflowCode;
            workflowCode = Request["WorkflowCode"];
            //string workflowPackage, workflowName;
            // workflowPackage = Request["PackageName"];
            //workflowName = Request["WorkflowName"];
            //Data.ClauseDataItem[] items = this.Engine.ClauseDataManager.GetColumns(workflowPackage, workflowName);

            // 获得模板

            OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate template = AppUtility.Engine.WorkflowManager.GetDefaultWorkflow(workflowCode);
            StringBuilder builder = new StringBuilder();
            builder.Append("({Items:[");
            int index = 0;

            //foreach (OThinker.H3.WorkflowTemplate.ActivityTemplate tmp in template.)
            foreach (OThinker.H3.WorkflowTemplate.Activity tmp in template.Activities)
            {
                // if (tmp.DisplayName == this.PortalResource.GetString("AjaxServices_End")) continue;
                if (index > 0) builder.Append(",");
                builder.Append("{\"Name\":\"" + tmp.DisplayName + "\"}");
                index++;
            }
            builder.Append("]})");
            Response.Clear();
            Response.Write(builder.ToString());
            Response.Buffer = true;
        }

        /// <summary>
        /// 获取所有活动名称
        /// </summary>
        private void GetUnitType()
        {
            string unitIds;
            string result = string.Empty;
            OThinker.Organization.Unit unit;
            unitIds = Request["ID"];
            string[] ids = unitIds.Split(new string[] { ";", "," }, StringSplitOptions.RemoveEmptyEntries);
            foreach (string id in ids)
            {
                unit = AppUtility.Engine.Organization.GetUnit(id);
                if (unit.UnitType == Organization.UnitType.OrganizationUnit
                    || unit.UnitType == Organization.UnitType.Group
                    || unit.UnitType == Organization.UnitType.Post)
                {
                    result += result == string.Empty ? unit.Name : "," + unit.Name;
                }
            }

            Response.Clear();
            Response.Write(result.ToString());
            Response.Buffer = true;
        }

        /// <summary>
        /// 获取用户信息
        /// </summary>
        /// <returns></returns>
        public void GetUserInfo()
        {
            string userId = Request["UserID"];
            Organization.User user = AppUtility.Engine.Organization.GetUnit(userId) as Organization.User;
            Employee u = null;
            if (user != null)
            {
                u = new Employee()
                {
                    ObjectID = user.ObjectID,
                    Name = user.Name,
                    Email = user.Email,
                    Description = user.Description,
                    // Country = user.Country,
                    EmployeeNumber = user.EmployeeNumber,
                    EmployeeRank = user.EmployeeRank,
                    // Street = user.Street,
                    Birthday = user.Birthday,
                    OfficePhone = user.OfficePhone,
                    Mobile = user.Mobile,
                    PostalCode = user.PostalCode,
                    PostOfficeBox = user.PostOfficeBox,
                    // City = user.City,
                    ParentID = user.ParentID//,
                    // SourceParentID = user.SourceID
                    // Province = user.Province
                };
                u.DepartName = AppUtility.Engine.Organization.GetName(u.ParentID);
                u.DepartmentName = u.DepartName;
                string company = AppUtility.Engine.Organization.GetParent(u.ParentID);
                if (company != null)
                {
                    // u.CompanyID = company;
                    // u.CompanyName = AppUtility.Engine.Organization.GetName(u.CompanyID);
                }
            }
            Response.Clear();
            Response.Write(JSSerializer.Serialize(u));
            Response.Buffer = true;
        }

        /// <summary>
        /// 获取联动规则的数据，数据源来自 BizBus
        /// </summary>
        protected void GetLinkageData()
        {
            string targetId = Request["TargetID"];
            string schemaCode = Request["SchemaCode"];
            string filterMethod = Request["FilterMethod"];
            string queryCode = Request["QueryCode"];
            string queryPropertyName = Request["QueryPropertyName"];
            string queryPropertyValue = Request["QueryPropertyValue"];
            string textDataField = Request["TextDataField"];
            string valueDataField = Request["ValueDataField"];

            // 获取查询对象
            //BizQuery query = OThinker.H3.WorkSheet.AppUtility.Engine.BizBus.GetBizQuery(schemaCode, queryCode);
            DataModel.BizQuery query = AppUtility.Engine.BizObjectManager.GetBizQuery(queryCode);
            // 构造查询条件
            OThinker.H3.BizBus.Filter.Filter filter = new BizBus.Filter.Filter();
            OThinker.H3.BizBus.Filter.And and = new And();
            filter.Matcher = and;
            ItemMatcher propertyMatcher = null;
            if (query.QueryItems != null)
            {
                string[] values = queryPropertyValue.Split(new string[] { "," }, StringSplitOptions.None);
                int i = 0;
                foreach (DataModel.BizQueryItem queryItem in query.QueryItems)
                { // 增加系统参数条件
                    if (queryItem.FilterType == DataModel.FilterType.SystemParam)
                    {
                        propertyMatcher = new OThinker.H3.BizBus.Filter.ItemMatcher(queryItem.PropertyName,
                             OThinker.Data.ComparisonOperatorType.Equal,
                            SheetUtility.GetSystemParamValue(UserValidatorFactory.CurrentUser, queryItem.SelectedValues));
                        and.Add(propertyMatcher);
                        continue;
                    }
                    else if (values.Length > 1)
                    {
                        if (values.Length > i)
                        {
                            propertyMatcher = new OThinker.H3.BizBus.Filter.ItemMatcher(queryItem.PropertyName,
                                 queryItem.FilterType == DataModel.FilterType.Contains ? OThinker.Data.ComparisonOperatorType.Contain : OThinker.Data.ComparisonOperatorType.Equal,
                                  values[i]);
                            and.Add(propertyMatcher);
                        }
                    }
                    else if (queryItem.PropertyName == queryPropertyName)
                    {
                        propertyMatcher = new OThinker.H3.BizBus.Filter.ItemMatcher(queryPropertyName,
                             queryItem.FilterType == DataModel.FilterType.Contains ? OThinker.Data.ComparisonOperatorType.Contain : OThinker.Data.ComparisonOperatorType.Equal,
                              queryPropertyValue);
                        and.Add(propertyMatcher);
                    }
                    i++;
                }
            }
            DataModel.BizObjectSchema schema = AppUtility.Engine.BizObjectManager.GetPublishedSchema(schemaCode);
            Dictionary<string, string> SelectItems = new Dictionary<string, string>();
            if (schema != null)
            {
                // 调用查询获取数据源
                //OThinker.H3.DataModel.BizObject[] objs = schema.GetList(OThinker.H3.WorkSheet.AppUtility.Engine.BizBus,
                //    this.UserValidator.UserID,
                //    filterMethod,
                //    filter);
                DataModel.BizObject[] objs = schema.GetList(
                    AppUtility.Engine.Organization,
                    AppUtility.Engine.MetadataRepository,
                    AppUtility.Engine.BizObjectManager,
                    UserValidatorFactory.CurrentUser != null ? UserValidatorFactory.CurrentUser.UserID : string.Empty,
                    filterMethod,
                    filter);

                DataTable dtSource = DataModel.BizObjectUtility.ToTable(schema, objs);
                foreach (DataRow row in dtSource.Rows)
                {
                    SelectItems.Add(row[valueDataField] + string.Empty, row[textDataField] + string.Empty);
                }
            }

            Response.Clear();
            Response.Write(JSSerializer.Serialize(SelectItems));
            Response.Buffer = true;
        }

        protected void GetFunctionNames()
        {
            string categoryCode = Request["CategoryCode"] + string.Empty;

            UserValidator user = UserValidatorFactory.CurrentUser;

            OThinker.H3.Acl.FunctionNode[] functions = user.GetFunctionsByParentCode(categoryCode);
            List<OThinker.H3.Acl.FunctionNode> result = new List<Acl.FunctionNode>();
            foreach (OThinker.H3.Acl.FunctionNode def in functions)
            {
                if (string.IsNullOrEmpty(def.DisplayName))
                {
                    def.DisplayName = def.DisplayName;// this.PortalResource.GetString("Function_" + def.Code.Trim());
                }
                result.Add(def);
            }
            Response.Clear();
            Response.Write(JSSerializer.Serialize(result));
            Response.Buffer = true;
        }

        #endregion
    }

    public class Employee : Organization.User
    {
        /// <summary>
        /// 获取或设置用户所在的部门名称
        /// </summary>
        public string DepartName { get; set; }
        /// <summary>
        /// 获取或设置用户所在的公司名称
        /// </summary>
        public string CompanyName { get; set; }
    }
}