using System;
using System.Collections;
using System.Configuration;
using System.Data;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;
using System.IO;
using OThinker.H3.Data;
using OThinker.H3.Controllers;

namespace OThinker.H3.Portal
{
    public partial class OfficeService : Page
    {
        /// <summary>
        /// 流程引擎的接口，该接口会比this.Engine的方式更快，因为其中使用了缓存
        /// </summary>
        public IEngine Engine
        {
            get
            {
                return OThinker.H3.Controllers.AppUtility.Engine;
            }
        }

        #region 当前用户存储对象 -----------------------
        /// <summary>
        /// 获得当前登陆用户的权限对象
        /// </summary>
        public UserValidator UserValidator
        {
            get
            {
                return this.GetUserValidator(this.Page);
            }
        }

        /// <summary>
        /// 获取当前用户信息
        /// </summary>
        /// <param name="Page"></param>
        /// <returns></returns>
        public UserValidator GetUserValidator(Page Page)
        {
            string message = null;
            UserValidator user = UserValidatorFactory.GetUserValidator(Page, this.GetPortalRoot(Page), out message);
            if (user == null)
            {
                //string url = GetNotifyUrl(Page, message);
                Page.Response.Redirect("../index.html");
                return null;
            }
            else
            {
                return user;
            }
        }

        /// <summary>
        /// 获得根目录地址
        /// </summary>
        /// <param name="Page"></param>
        /// <returns></returns>
        public string GetPortalRoot(System.Web.UI.Page Page)
        {
            string root = System.Configuration.ConfigurationManager.AppSettings["PortalRoot"];
            return string.IsNullOrEmpty(root) ? "/" : root;
        }

        #endregion

        protected void Page_Load(object sender, EventArgs e)
        {
            if (Request.Files.Count == 0) Response.End();

            string ID = Request.Form["ID"];
            string dataField = Request.Form["dataField"];
            string instanceID = Request.Form["InstanceID"] + string.Empty;
            string download = Request.Form["download"] + string.Empty;
            string bizObjectID = Request.Form["BizObjectID"] + string.Empty;
            string schemaCode = Request.Form["SchemaCode"] + string.Empty;
            string saveType = Request.Form["SaveType"] + string.Empty;//判断是保存正文还是PDF，doc:正文，pdf:PDF
            //string workflowPackage = Request.Form["WorkflowPackage"] + string.Empty;
            //string workflowName = Request.Form["WorkflowName"] + string.Empty;
            string fileExtension = ".doc";
            if (saveType.ToLower() == "pdf") { fileExtension = ".pdf"; }

            //保存 WORD 文档保存的文件名称为 [流程实例名称].doc，如果流程实例名称为空，那么保存为 BizObjectID.doc
            string fileName = bizObjectID;
            if (!string.IsNullOrEmpty(instanceID))
            {
                OThinker.H3.Instance.InstanceContext context  = AppUtility.Engine.InstanceManager.GetInstanceContext(instanceID);
                if (context != null)
                {
                    string InstanceName = context.InstanceName;
                    if (!string.IsNullOrEmpty(InstanceName)) { fileName = InstanceName; }
                }
                else
                {
                    bizObjectID = instanceID; //发起的时候没有BizObjectID,使用InstanceID，在打开时修改BizObjectID
                }
                
                AttachmentHeader[] attachs = AppUtility.Engine.BizObjectManager.QueryAttachment(schemaCode, bizObjectID,dataField, OThinker.Data.BoolMatchValue.True, null);
                if (attachs != null && attachs.Length > 0)
                {
                    ID = attachs[0].AttachmentID;
                }
                else
                {
                    ID = Guid.NewGuid().ToString();
                }
            }
            else
            {
                ID = Guid.NewGuid().ToString();
            }

            fileName = fileName + fileExtension;

            byte[] fileValue = new byte[Request.Files[0].ContentLength];
            if (fileValue.Length == 0) return; // 没有接收到数据，则不做保存
            Request.Files[0].InputStream.Read(fileValue, 0, Request.Files[0].ContentLength);
            OThinker.H3.Data.Attachment attachment = new OThinker.H3.Data.Attachment()
            {
                ObjectID = ID,
                FileName = fileName,//HttpUtility.UrlDecode(Request.Files[0].FileName),
                ContentType = Request.Files[0].ContentType,
                Content = fileValue,
                DataField = HttpUtility.UrlDecode(dataField),
                CreatedBy = this.UserValidator.UserID,
                Downloadable = true,
                BizObjectId = bizObjectID,
                BizObjectSchemaCode = schemaCode
            };
            try
            {
                //保存 更新文件
                this.Engine.BizObjectManager.RemoveAttachment(string.Empty, 
                    schemaCode, 
                    attachment.BizObjectId, 
                    attachment.AttachmentID);
                this.Engine.BizObjectManager.AddAttachment(attachment);
            }
            catch (Exception ex)
            {
                this.Engine.LogWriter.Write("WordSave Error:" + ex.ToString());
            }
        }
    }
}