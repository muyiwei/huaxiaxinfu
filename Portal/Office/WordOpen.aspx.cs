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
using System.Xml.Linq;
using OThinker.H3.Controllers;
using OThinker.H3.Portal;

public partial class Office_WordOpen : Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        string dataField, attachmentId;
        dataField = HttpUtility.UrlDecode(Request.QueryString["dataField"]);
        attachmentId = Request.QueryString["AttachmentID"];
        string bizObjectID = Request.QueryString["BizObjectID"] + string.Empty;
        string instanceID = Request.QueryString["InstanceID"] + string.Empty;
        string schemaCode = HttpUtility.UrlDecode(Request.QueryString["SchemaCode"] + string.Empty);
        if (string.IsNullOrEmpty(attachmentId))
        {
            //先查找BizObjectID为InstanceID的附件，然后在找BizObjectID的附件
            OThinker.H3.Data.AttachmentHeader[] attachs = AppUtility.Engine.BizObjectManager.QueryAttachment(schemaCode, instanceID, dataField, OThinker.Data.BoolMatchValue.True, null);
            if (attachs != null && attachs.Length > 0)
            {
                System.Collections.Generic.List<string> lstAttachmentids = new System.Collections.Generic.List<string>();
                foreach (OThinker.H3.Data.AttachmentHeader header in attachs)
                {
                    lstAttachmentids.Add(header.AttachmentID);
                }

                //更新BizObjectID
                AppUtility.Engine.BizObjectManager.AttachBizObject(
                   OThinker.Organization.User.AdministratorID,
                    lstAttachmentids.ToArray(),
                    schemaCode,
                    bizObjectID,
                    dataField);
            }
            
            OThinker.H3.Data.AttachmentHeader[] attachments = AppUtility.Engine.BizObjectManager.QueryAttachment(schemaCode, bizObjectID, dataField, OThinker.Data.BoolMatchValue.True, null);
            if (attachments != null && attachments.Length > 0)
                attachmentId = attachments[0].ObjectID;
        }

        if (!string.IsNullOrEmpty(attachmentId))
        {
            OThinker.H3.Data.Attachment attachment = AppUtility.Engine.BizObjectManager.GetAttachment(string.Empty,
                schemaCode,
                bizObjectID,
                attachmentId);

            //设定输出文件类型
            Response.ContentType = attachment.ContentType;
            // 输出文件内容
            Response.OutputStream.Write(attachment.Content, 0, attachment.Content.Length);
            Response.End();
        }
        else
        {
           // Response.Write("<script>alert('" + this.PortalResource.GetString("SheetOffcie_HasPDF") + "');</script>");
        }
            
    }
}