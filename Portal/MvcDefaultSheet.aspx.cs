using System;
using System.Collections;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Web;
using System.Web.SessionState;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using OThinker.H3.Controllers;
using OThinker.H3.DataModel;

namespace OThinker.H3.Portal
{
    /// <summary>
    /// 默认表单
    /// </summary>
    public partial class MvcDefaultSheet : MvcPage
    {
        /// <summary>
        /// 占2/12的css
        /// </summary>
        private const string CSS2 = "col-md-2";
        /// <summary>
        /// 占3/12的css
        /// </summary>
        private const string CSS3 = "col-md-3";
        /// <summary>
        /// 占4/12的css
        /// </summary>
        private const string CSS4 = "col-md-4";
        /// <summary>
        /// 占9/12的css
        /// </summary>
        private const string CSS9 = "col-md-9";
        /// <summary>
        /// 占10/12的css
        /// </summary>
        private const string CSS10 = "col-md-10";

        /// <summary>
        /// 构造函数
        /// </summary>
        public MvcDefaultSheet()
            : base()
        {

        }

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

        /// <summary>
        /// 是否修改数据项模式
        /// </summary>
        private bool IsEditInstanceData
        {
            get
            {
                if (Request.QueryString["EditInstanceData"] != null
                    && Request.QueryString["EditInstanceData"] + string.Empty != string.Empty)
                {
                    return true;
                }
                return false;
            }
        }
        #endregion

        #region 表单事件 ----------------------------------
        /// <summary>
        /// 页面加载事件
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void Page_Load(object sender, EventArgs e)
        {
            var user = HttpContext.Current.Session[Sessions.GetUserValidator()];
            if (null == user)
            {
                return;
            }
        }

        /// <summary>
        /// 表单初始化事件
        /// </summary>
        /// <param name="e"></param>
        protected override void OnInit(EventArgs e)
        {
            // if (this.ActionContext.Sheet == null) return;
            if (!Page.IsPostBack)
            {
                string Command = Request["Command"] + string.Empty;
                if (string.IsNullOrEmpty(Command))
                {
                    if (IsEditInstanceData)
                    {// 编辑数据项模式，需要验证权限
                        if (!this.ActionContext.User.ValidateOrgAdmin(this.ActionContext.BizObject.OwnerId) && !this.ActionContext.User.ValidateBizObjectAdmin(this.ActionContext.SchemaCode,
                            string.Empty,
                            this.ActionContext.BizObject.OwnerId))
                        {
                            Response.End();
                        }
                        FillTableControlOnPC(this.ActionContext.SchemaCode);
                    }
                    else
                    {
                        if (!string.IsNullOrEmpty(this.ActionContext.Sheet.RuntimeContent))// && !this.Enviroment.IsMobile)
                        {

                            // 在PC状态下，打开表单设计器加载内容
                            this.divContent.Controls.Clear();
                            this.divContent.InnerHtml = this.ActionContext.Sheet.RuntimeContent;
                        }
                        else
                        {
                            FillTableControlOnPC(this.ActionContext.SchemaCode);
                        }
                    }
                }
            }

            base.OnInit(e);
        }
        #endregion

        #region 填充表单控件 ------------------------------
        /// <summary>
        /// PC时填充表格控件
        /// </summary>
        /// <param name="schemaCode"></param>
        private void FillTableControlOnPC(string schemaCode)
        {
            // 控件的索引号
            int controlIndex = 0;
            string labelId, controlId;
            // 当前控件是否单独行
            bool currentRowIsLarg = false;
            // 下一控件是否单独行
            bool nextRowIsLarg = false;
            BizObjectSchema schema = AppUtility.Engine.BizObjectManager.GetPublishedSchema(schemaCode);
            if (schema == null) schema = AppUtility.Engine.BizObjectManager.GetDraftSchema(schemaCode);
            if (schema.Fields == null || schema.Fields.Length == 0) return;
            int cellIndex = 0;
            HtmlGenericControl row = null;
            string colCss = string.Empty;

            foreach (FieldSchema field in schema.Fields)
            {
                controlIndex++;
                if (BizObjectSchema.IsReservedProperty(field.Name)) continue;
                if (!BizObjectSchema.IsSheetLogicType(field.LogicType)) continue;
                cellIndex++;
                labelId = "Label" + controlIndex;
                controlId = "Control" + controlIndex;
                currentRowIsLarg = OThinker.H3.Data.DataLogicTypeConvertor.IsLargType(field.LogicType);
                nextRowIsLarg = (controlIndex < schema.Fields.Length) ? OThinker.H3.Data.DataLogicTypeConvertor.IsLargType(schema.Fields[controlIndex].LogicType) : false;

                if (cellIndex % 2 == 1)
                {// 奇数或者是单独行，那么写入一个 TR
                    row = new HtmlGenericControl("div");
                    row.ClientIDMode = System.Web.UI.ClientIDMode.Static;
                    if (field.LogicType == OThinker.H3.Data.DataLogicType.BizObjectArray)
                    {
                        row.Attributes.Add("class", "row tableContent");
                    }
                    else
                    {
                        row.Attributes.Add("class", "row");
                    }
                    this.divSheet.Controls.Add(row);
                }
                colCss = currentRowIsLarg ? CSS10 : CSS4;

                // 行标题
                HtmlGenericControl rowTitle = new HtmlGenericControl("div");
                rowTitle.Attributes.Add("class", CSS2);
                Label lblTitle = new Label() { Text = field.DisplayName };
                lblTitle.Attributes.Add("data-datafield", field.Name);
                rowTitle.Controls.Add(lblTitle);
                row.Controls.Add(rowTitle);

                HtmlGenericControl rowControl = new HtmlGenericControl("div");
                rowControl.Attributes.Add("class", colCss);
                HtmlGenericControl cellControl = this.GetCellControl(schema, field, "control" + controlIndex, string.Empty, string.Empty, false);
                if (cellControl != null)
                {
                    rowControl.Controls.Add(cellControl);
                }
                row.Controls.Add(rowControl);

                if (cellIndex % 2 == 1 && (currentRowIsLarg || nextRowIsLarg || controlIndex == schema.Fields.Length))
                {
                    cellIndex++;
                }
            }
        }

        /// <summary>
        /// 获取子表结构
        /// </summary>
        /// <param name="Schema"></param>
        /// <param name="Field"></param>
        /// <returns></returns>
        private BizObjectSchema GetChildSchema(BizObjectSchema schema, FieldSchema field)
        {
            PropertySchema property = schema.GetProperty(field.Name);
            if (property != null && property.ChildSchema != null) return property.ChildSchema;
            return this.Engine.BizObjectManager.GetPublishedSchema(field.ChildSchemaCode);
        }

        /// <summary>
        /// 获取单元格控件
        /// </summary>
        /// <param name="schema"></param>
        /// <param name="field"></param>
        /// <param name="controlId"></param>
        /// <param name="parentFieldName"></param>
        /// <param name="parentControlId"></param>
        /// <param name="isCount"></param>
        /// <returns></returns>
        private HtmlGenericControl GetCellControl(BizObjectSchema schema,
            FieldSchema field,
            string controlId,
            string parentFieldName,
            string parentControlId,
            bool isCount)
        {
            HtmlGenericControl cellControl = null;
            string datafield = field.Name;
            if (!string.IsNullOrEmpty(parentFieldName)) datafield = parentFieldName + "." + field.Name;
            if (!isCount)
            {
                switch (field.LogicType)
                {
                    #region 生成控件 ---------------------------
                    case OThinker.H3.Data.DataLogicType.Comment:
                        if (!IsEditInstanceData)
                        {
                            cellControl = new HtmlGenericControl("div");
                            cellControl.Attributes.Add("data-datafield", datafield);
                        }
                        break;
                    case OThinker.H3.Data.DataLogicType.Attachment:
                        cellControl = new HtmlGenericControl("div");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        break;
                    case OThinker.H3.Data.DataLogicType.String:
                    case Data.DataLogicType.Xml:
                        cellControl = new HtmlGenericControl("textarea");
                        cellControl.ID = Guid.NewGuid().ToString();
                        cellControl.Attributes.Add("data-datafield", datafield);
                        break;
                    case OThinker.H3.Data.DataLogicType.Html:
                        cellControl = new HtmlGenericControl("textarea");
                        cellControl.ID = Guid.NewGuid().ToString();
                        cellControl.Attributes.Add("data-datafield", datafield);
                        cellControl.Attributes.Add("data-RichTextBox", "true");
                        break;
                    case OThinker.H3.Data.DataLogicType.Bool:
                        cellControl = new HtmlGenericControl("input");
                        cellControl.Attributes.Add("type", "checkbox");
                        cellControl.Attributes.Add("data-type", "SheetCheckbox");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        break;
                    case OThinker.H3.Data.DataLogicType.DateTime:
                        cellControl = new HtmlGenericControl("input");
                        cellControl.Attributes.Add("type", "text");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        break;
                    case OThinker.H3.Data.DataLogicType.TimeSpan:
                        cellControl = new HtmlGenericControl("div");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        break;
                    case OThinker.H3.Data.DataLogicType.Double:
                    case Data.DataLogicType.Decimal:
                    case OThinker.H3.Data.DataLogicType.Int:
                    case OThinker.H3.Data.DataLogicType.Long:
                    case OThinker.H3.Data.DataLogicType.ShortString:
                    case Data.DataLogicType.Guid:
                        cellControl = new HtmlGenericControl("input");
                        cellControl.Attributes.Add("type", "text");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        break;
                    case OThinker.H3.Data.DataLogicType.HyperLink:  // 链接控件
                        cellControl = new HtmlGenericControl("a");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        break;
                    case OThinker.H3.Data.DataLogicType.SingleParticipant:  // 选人控件 单选
                    case OThinker.H3.Data.DataLogicType.MultiParticipant:   // 选人控件 多选
                        cellControl = new HtmlGenericControl("div");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        break;
                    case OThinker.H3.Data.DataLogicType.Association:
                        cellControl = new HtmlGenericControl("input");
                        cellControl.Attributes.Add("type", "text");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        cellControl.Attributes.Add("data-type", "SheetAssociation");
                        cellControl.Attributes.Add("readonly", "true");
                        cellControl.Attributes.Add("data-schemacode", field.DefaultValue + string.Empty);
                        break;
                    case Data.DataLogicType.BizObject:
                    case Data.DataLogicType.BizObjectArray:
                        cellControl = new HtmlGenericControl("table");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        cellControl.Attributes.Add("class", "SheetGridView");
                        BizObjectSchema childSchema = this.GetChildSchema(schema, field);
                        if (childSchema == null) break;
                        HtmlGenericControl titleRow = new HtmlGenericControl("tr");
                        titleRow.Attributes.Add("class", "header");
                        cellControl.Controls.Add(titleRow);

                        HtmlGenericControl templateRow = new HtmlGenericControl("tr");
                        templateRow.Attributes.Add("class", "template");
                        cellControl.Controls.Add(templateRow);

                        HtmlGenericControl countRow = new HtmlGenericControl("tr");
                        countRow.Attributes.Add("class", "footer");
                        cellControl.Controls.Add(countRow);

                        if (field.LogicType == Data.DataLogicType.BizObjectArray)
                        {
                            // 序号列
                            HtmlGenericControl serialTitleTd = new HtmlGenericControl("td");
                            serialTitleTd.InnerText = "序号";
                            serialTitleTd.Attributes.Add("class", "rowSerialNo");
                            titleRow.Controls.Add(serialTitleTd);

                            HtmlGenericControl serialControlTd = new HtmlGenericControl("td");
                            serialControlTd.Attributes.Add("class", "rowOption");
                            templateRow.Controls.Add(serialControlTd);

                            HtmlGenericControl countTd = new HtmlGenericControl("td");
                            countTd.Attributes.Add("class", "rowOption");
                            countRow.Controls.Add(countTd);
                        }

                        // 数据列
                        int index = 0;
                        foreach (PropertySchema property in childSchema.Properties)
                        {
                            if (BizObjectSchema.IsReservedProperty(property.Name)) continue;
                            index++;

                            FieldSchema fieldschema = new FieldSchema(property);
                            string detailDatafiled = fieldschema.Name;
                            if (!string.IsNullOrEmpty(field.Name)) detailDatafiled = field.Name + "." + fieldschema.Name;

                            HtmlGenericControl headerTd = new HtmlGenericControl("td");
                            headerTd.InnerText = property.DisplayName;
                            headerTd.Attributes.Add("data-datafield", detailDatafiled);
                            titleRow.Controls.Add(headerTd);

                            HtmlGenericControl controlTd = new HtmlGenericControl("td");
                            HtmlGenericControl childCellControl = GetCellControl(schema, fieldschema, "cell" + index, field.Name, controlId, false);
                            if (childCellControl != null) controlTd.Controls.Add(childCellControl);
                            controlTd.Attributes.Add("data-datafield", detailDatafiled);
                            templateRow.Controls.Add(controlTd);

                            HtmlGenericControl countTd = new HtmlGenericControl("td");
                            HtmlGenericControl countCellControl = GetCellControl(schema, fieldschema, "cell" + index, field.Name, controlId, true);
                            if (countCellControl != null) countTd.Controls.Add(countCellControl);
                            countTd.Attributes.Add("data-datafield", detailDatafiled);
                            countRow.Controls.Add(countTd);
                        }

                        if (field.LogicType == Data.DataLogicType.BizObjectArray)
                        {// 删除列
                            HtmlGenericControl deleteTitleTd = new HtmlGenericControl("td");
                            deleteTitleTd.InnerText = "删除";
                            deleteTitleTd.Attributes.Add("class", "rowOption");
                            titleRow.Controls.Add(deleteTitleTd);

                            HtmlGenericControl deleteControlTd = new HtmlGenericControl("td");
                            deleteControlTd.InnerHtml = "<a class=\"delete\"><div class=\"fa fa-minus\"></div></a><a class=\"insert\"><div class=\"fa fa-arrow-down\"></div></a>";
                            deleteControlTd.Attributes.Add("class", "rowOption");
                            templateRow.Controls.Add(deleteControlTd);

                            HtmlGenericControl countTd = new HtmlGenericControl("td");
                            countTd.Attributes.Add("class", "rowOption");
                            countRow.Controls.Add(countTd);
                        }
                        break;
                    case OThinker.H3.Data.DataLogicType.ByteArray:
                    case OThinker.H3.Data.DataLogicType.Object:
                    default:
                        cellControl = new HtmlGenericControl("div");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        break;

                    #endregion
                }
            }
            else
            {
                switch (field.LogicType)
                {
                    case OThinker.H3.Data.DataLogicType.Double:
                    case Data.DataLogicType.Decimal:
                    case OThinker.H3.Data.DataLogicType.Int:
                    case OThinker.H3.Data.DataLogicType.Long:
                        cellControl = new HtmlGenericControl("label");
                        cellControl.Attributes.Add("data-datafield", datafield);
                        break;
                    default:
                        break;
                }
            }
            if (cellControl != null)
            {
                if (!string.IsNullOrEmpty(parentControlId)) cellControl.ID = controlId;
                else cellControl.ID = parentControlId + "_" + controlId;
            }
            return cellControl;
        }
        #endregion

        public override MvcViewContext LoadDataFields()
        {
            return base.LoadDataFields();
        }

        public override void SaveDataFields(MvcPostValue MvcPostValue, MvcResult MvcResult)
        {
            base.SaveDataFields(MvcPostValue, MvcResult);
        }
    }
}