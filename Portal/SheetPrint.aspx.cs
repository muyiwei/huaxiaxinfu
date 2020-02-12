using OThinker.H3.Controllers;
using OThinker.H3.DataModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace OThinker.H3.Portal
{
    public partial class SheetPrint : MvcPage
    {
        #region 默认表单属性 ------------------------------
        /// <summary>
        /// 获取资源文件访问对象
        /// </summary>
        //protected System.Resources.ResourceManager PortalResource
        //{
        //    get
        //    {
        //        return Resources.Resource.ResourceManager;
        //    }
        //}

        /// <summary>
        /// 流程引擎的接口，该接口会比this.Engine的方式更快，因为其中使用了缓存
        /// </summary>
        public IEngine Engine
        {
            get
            {
                return AppUtility.Engine;
            }
        }
        #endregion

      

        /// <summary>
        /// 表单加载事件
        /// </summary>
        public override  MvcViewContext LoadDataFields()
        {
           MvcViewContext viewContext =  base.LoadDataFields();
            return viewContext;
        }

        public Object GetPrintContent()
        {
            string printModel = this.ActionContext.Sheet.PrintModel;
            if (string.IsNullOrEmpty(printModel)) return null;

            string printContent = GetPrintContentString(printModel);
            
            return new
            {
                printContent = printContent
            };
        }

        /// <summary>
        /// 获取打印内容
        /// </summary>
        /// <param name="printModel"></param>
        /// <returns></returns>
        public string GetPrintContentString(string printModel)
        {
            StringBuilder printContent = new StringBuilder();
            // 优先处理子表
            string[] grids = printModel.Split(new string[] { "<Row>" }, StringSplitOptions.None);
            if (grids.Length > 1)
            {
                string rowTemplate = string.Empty;
                for (int i = 0; i < grids.Length; i++)
                {
                    if (i == 0 || grids[i].IndexOf("}") == -1)
                    {
                        printContent.Append(grids[i]);
                        continue;
                    }

                    rowTemplate = grids[i].Substring(0, grids[i].IndexOf("</Row>"));

                    printContent.Append(GetGridValue(rowTemplate));
                    printContent.Append(grids[i].Substring(grids[i].IndexOf("</Row>") + 6));
                }
            }
            else
            {
                printContent.Append(printModel);
            }

            // 处理数据项
            string[] fields = printContent.ToString().Split(new string[] { "{" }, StringSplitOptions.None);
            if (fields.Length == 1) return printContent.ToString();

            printContent.Clear();
            string field;

            for (int i = 0; i < fields.Length; i++)
            {
                if (i == 0 || fields[i].IndexOf("}") == -1)
                {
                    printContent.Append(fields[i]);
                    continue;
                }

                field = fields[i].Substring(0, fields[i].IndexOf("}"));

                printContent.Append(GetFieldValue(field));
                printContent.Append(fields[i].Substring(fields[i].IndexOf("}") + 1));
            }
            return printContent.ToString();
        }

        /// <summary>
        /// 获取子表内容
        /// </summary>
        /// <param name="rowTemplate"></param>
        /// <returns></returns>
        private string GetGridValue(string rowTemplate)
        {
            // 获取第一个业务对象数组数据项
            string[] fields = rowTemplate.ToString().Split(new string[] { "{" }, StringSplitOptions.None);
            if (fields.Length == 1) return rowTemplate;

            string bizObjectField = string.Empty;  // 业务对象数组编码

            for (int i = 1; i < fields.Length; i++)
            {
                bizObjectField = fields[i].Substring(0, fields[i].IndexOf("}"));
                if (bizObjectField.IndexOf(".") > 0) bizObjectField = bizObjectField.Substring(0, bizObjectField.IndexOf("."));
                if (this.ActionContext.InstanceData[bizObjectField] != null
                    && this.ActionContext.InstanceData[bizObjectField].LogicType == Data.DataLogicType.BizObjectArray)
                {
                    break;
                }
                bizObjectField = string.Empty;
            }

            // 没有找到业务对象数组数据项
            if (bizObjectField == string.Empty) return rowTemplate;

            BizObject[] bizObjects = this.ActionContext.InstanceData[bizObjectField].Value as BizObject[];
            if (bizObjects == null || bizObjects.Length == 0) return string.Empty;

            StringBuilder gridContent = new StringBuilder();
            string field;
            foreach (BizObject obj in bizObjects)
            {
                for (int i = 0; i < fields.Length; i++)
                {
                    if (i == 0 || fields[i].IndexOf("}") == -1)
                    {
                        gridContent.Append(fields[i]);
                        continue;
                    }

                    field = fields[i].Substring(0, fields[i].IndexOf("}"));
                    if (field.IndexOf(".") > 0) field = field.Substring(field.IndexOf(".") + 1);

                    gridContent.Append(GetBizObjectFieldValue(obj, field));
                    gridContent.Append(fields[i].Substring(fields[i].IndexOf("}") + 1));
                }
            }
            return gridContent.ToString();
        }

        /// <summary>
        /// 获取业务对象的字段值
        /// </summary>
        /// <param name="obj"></param>
        /// <param name="field"></param>
        /// <returns></returns>
        private string GetBizObjectFieldValue(BizObject obj, string field)
        {
            PropertySchema property = obj.Schema.GetProperty(field);
            if (property == null) return string.Empty;
            string result = string.Empty;

            switch (property.LogicType)
            {
                case Data.DataLogicType.String:
                case Data.DataLogicType.ShortString:
                case Data.DataLogicType.Decimal:
                case Data.DataLogicType.Double:
                case Data.DataLogicType.Int:
                case Data.DataLogicType.Html:
                case Data.DataLogicType.Long:
                case Data.DataLogicType.TimeSpan:
                    result = obj[field] + string.Empty;
                    break;
                case Data.DataLogicType.DateTime:
                    DateTime d = DateTime.Now;
                    DateTime.TryParse(obj[field] + string.Empty, out d);
                    result = d.ToString("yyyy-MM-dd");
                    break;
                case Data.DataLogicType.SingleParticipant:
                    if (obj[field] + string.Empty != string.Empty)
                    {
                        result = this.Engine.Organization.GetName(obj[field] + string.Empty);
                    }
                    break;
                case Data.DataLogicType.MultiParticipant:
                    {
                        string[] users = obj[field] as string[];
                        if (users != null && users.Length > 0)
                        {
                            Organization.Unit[] units = this.Engine.Organization.GetUnits(users).ToArray();
                            if (units != null)
                            {
                                foreach (Organization.Unit unit in units)
                                {
                                    result += result == string.Empty ? string.Empty : "、";
                                    result += unit.Name;
                                }
                            }
                        }
                    }
                    break;
                case Data.DataLogicType.Attachment:
                    {
                        Data.AttachmentHeader[] headers = this.Engine.BizObjectManager.QueryAttachment(
                                  this.ActionContext.SchemaCode,
                                  obj.ObjectID,
                                  field,
                                  OThinker.Data.BoolMatchValue.True,
                                  null);
                        if (headers != null)
                        {
                            for (int i = 0; i < headers.Length; i++)
                            {
                                result += result == string.Empty ? string.Empty : "<br>";
                                result += (i + 1) + "、" + headers[i].FileName;
                            }
                        }
                    }
                    break;
                case Data.DataLogicType.Bool:
                    bool b = false;
                    bool.TryParse(obj[field] + string.Empty, out b);
                    result = b ?"SheetPrint_Yes" : "SheetPrint_No";
                    break;
                default:
                    result = string.Empty;
                    break;
            }
            return result;
        }

        /// <summary>
        /// 获取指定数据项的值
        /// </summary>
        /// <param name="field"></param>
        /// <returns></returns>
        private string GetFieldValue(string field)
        {
            string param = string.Empty;

            Instance.IInstanceDataItem data = this.ActionContext.InstanceData[field];
            if (data == null && field.IndexOf(".") > -1)
            {
                // 处理field逻辑
                param = field.Substring(field.IndexOf(".") + 1);
                field = field.Substring(0, field.IndexOf("."));
                data = this.ActionContext.InstanceData[field];
            }
            if (data == null) return string.Empty;
            string result = string.Empty;

            switch (data.LogicType)
            {
                case Data.DataLogicType.String:
                case Data.DataLogicType.ShortString:
                case Data.DataLogicType.Decimal:
                case Data.DataLogicType.Double:
                case Data.DataLogicType.Int:
                case Data.DataLogicType.Html:
                case Data.DataLogicType.Long:
                case Data.DataLogicType.TimeSpan:
                    result = data.Value + string.Empty;
                    break;
                case Data.DataLogicType.DateTime:
                    DateTime d = DateTime.Now;
                    DateTime.TryParse(data.Value + string.Empty, out d);
                    result = d.ToString("yyyy-MM-dd");
                    break;
                case Data.DataLogicType.SingleParticipant:
                    if (data.Value + string.Empty != string.Empty)
                    {
                        result = this.Engine.Organization.GetName(data.Value + string.Empty);
                    }
                    break;
                case Data.DataLogicType.MultiParticipant:
                    {
                        string[] users = data.Value as string[];
                        if (users != null && users.Length > 0)
                        {
                            Organization.Unit[] units = this.Engine.Organization.GetUnits(users).ToArray();
                            if (units != null)
                            {
                                foreach (Organization.Unit unit in units)
                                {
                                    result += result == string.Empty ? string.Empty : "、";
                                    result += unit.Name;
                                }
                            }
                        }
                    }
                    break;
                case Data.DataLogicType.Attachment:
                    {
                        Data.AttachmentHeader[] headers = this.Engine.BizObjectManager.QueryAttachment(
                                  this.ActionContext.SchemaCode,
                                  this.ActionContext.BizObjectID,
                                  field,
                                  OThinker.Data.BoolMatchValue.True,
                                  null);
                        if (headers != null)
                        {
                            for (int i = 0; i < headers.Length; i++)
                            {
                                result += result == string.Empty ? string.Empty : "<br>";
                                result += (i + 1) + "、" + headers[i].FileName;
                            }
                        }
                    }
                    break;
                case Data.DataLogicType.Comment:
                    string activity = string.Empty;
                    string userId = string.Empty;
                    if (param.ToLower().StartsWith("activity:"))
                    {
                        activity = param.Substring(param.IndexOf(":") + 1);
                    }
                    else if (param.ToLower().StartsWith("user:"))
                    {
                        Organization.Unit u = this.Engine.Organization.GetUserByCode(param.Substring(param.IndexOf(":") + 1));
                        if (u != null) userId = u.ObjectID;
                    }
                    Data.Comment[] comments = GetComments(field, userId, activity);
                    if (comments != null)
                    {
                        if (param.ToLower() == "username")
                        {
                            Organization.Unit u = this.Engine.Organization.GetUnit(comments[comments.Length - 1].UserID);
                            result = u != null ? u.Name : comments[comments.Length - 1].UserID;
                        }
                        else if (param.ToLower() == "datetime")
                        {
                            result = comments[comments.Length - 1].CreatedTime.ToString("yyyy-MM-dd");
                        }
                        else
                        {
                            result = comments[comments.Length - 1].Text;
                        }
                    }
                    break;
                case Data.DataLogicType.Bool:
                    bool b = false;
                    bool.TryParse(data.Value + string.Empty, out b);
                    result = b ? "SheetPrint_Yes" : "SheetPrint_No";
                    break;
                case Data.DataLogicType.BizObject:
                    if (data != null)
                    {
                        result = GetBizObjectFieldValue(((BizObject)data), param);
                    }
                    break;
                case Data.DataLogicType.BizObjectArray:
                    // 子表打印，需要定义重复节
                    break;
                default:
                    result = string.Empty;
                    break;
            }
            return result;
        }

        private Dictionary<string, Data.Comment[]> DicComments = new Dictionary<string, Data.Comment[]>();

        /// <summary>
        /// 获取审核意见
        /// </summary>
        /// <param name="field"></param>
        /// <param name="userId"></param>
        /// <param name="activity"></param>
        /// <returns></returns>
        private Data.Comment[] GetComments(string field, string userId, string activity)
        {
            string key = field + "." + userId + "." + activity;
            if (DicComments.ContainsKey(key)) return DicComments[key];

            Data.Comment[] comments = this.Engine.BizObjectManager.GetCommentsByInstance(
                        this.ActionContext.SchemaCode,
                        this.ActionContext.BizObjectID,
                        this.ActionContext.InstanceId,
                        this.ActionContext.WorkItemID,
                        field,
                        userId,
                        activity);
            DicComments.Add(key, comments);
            return comments;
        }
    }
}