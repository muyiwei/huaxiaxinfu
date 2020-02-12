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
using System.Configuration;
using System.Data.SqlClient;
using System.Data.SqlTypes;
using System.Xml.Linq;
using OThinker.H3.Portal;
using System.IO;
using OThinker.H3.Data;

public partial class Office_Upload : Page
{
    /// <summary>
    /// 
    /// </summary>
    /// <param name="sender"></param>
    /// <param name="e"></param>
    protected void Page_Load(object sender, EventArgs e)
    {
        UpFileData();
    }

    /// <summary>
    /// 获取并上传附件
    /// </summary>
    public void UpFileData()
    {
        string strNewAttachIds = string.Empty;
        string dataField = Request.Form["dataField"];
        string instanceID = Request.Form["InstanceID"] + string.Empty;
        //新加的属性，待确认
        //ERROR: 
        string schemaCode = Request.Form["SchemaCode"] + string.Empty;
        string bizObjectID = Request.Form["BizObjectID"] + string.Empty;
        //string workflowPackage = Request.Form["WorkflowPackage"] + string.Empty;
        //string workflowName = Request.Form["WorkflowName"] + string.Empty;
        if (dataField == string.Empty) return;
        System.Web.HttpPostedFile theFile;
        //说明:若控件的参数 <PARAM NAME="DelFileField" VALUE="DELETE_FILE_NAMES">
        //则,从Request.Form得到的DELETE_FILE_NAMES集合包含了所有需要删除的文件
        //也就是客户端修改过的文件名
        string[] delFileNames = Request.Form.GetValues("DELETE_FILE_NAMES");
        System.Web.HttpFileCollection uploadFiles = Request.Files;

        try
        {
            OThinker.H3.Data.AttachmentHeader[] headers = null;
            if (instanceID != string.Empty)
            {

                headers = OThinker.H3.Controllers.AppUtility.Engine.BizObjectManager.QueryAttachment(schemaCode, bizObjectID, dataField, OThinker.Data.BoolMatchValue.True, string.Empty);
            }

            // 增加保存附件文件
            for (int i = 0; i < uploadFiles.Count; i++)
            {
                theFile = uploadFiles[i];
                // "EDITFILE"和客户端的BeginSaveToURL的第二个参数一致
                if (uploadFiles.GetKey(i).ToUpper() == "EDITFILE")
                {
                    // 写入FILE数据
                    string fname = theFile.FileName;
                    int fsize = theFile.ContentLength;
                    string contentType = theFile.ContentType;
                    byte[] buffer = new byte[theFile.ContentLength];
                    theFile.InputStream.Read(buffer, 0, fsize);

                    OThinker.H3.Data.Attachment attachment = new OThinker.H3.Data.Attachment()
                    {
                        ObjectID = Guid.NewGuid().ToString(),
                        FileName = fname,
                        ContentType = string.Empty,
                        Content = buffer,
                        DataField = HttpUtility.UrlDecode(dataField),
                        CreatedBy = OThinker.Organization.User.AdministratorID,
                        Downloadable = true,
                        BizObjectId = bizObjectID,
                        BizObjectSchemaCode = schemaCode
                    };

                    strNewAttachIds += attachment.ObjectID + ",";

                    OThinker.H3.Controllers.AppUtility.Engine.BizObjectManager.AddAttachment(attachment);
                }
            }
            if (headers != null && delFileNames != null)
            {
                foreach (OThinker.H3.Data.AttachmentHeader header in headers)
                {
                    if (Array.IndexOf<string>(delFileNames, header.FileName) > -1)
                        OThinker.H3.Controllers.AppUtility.Engine.BizObjectManager.RemoveAttachment(OThinker.Organization.User.AdministratorID,
                            schemaCode,
                            header.BizObjectId,
                            header.ObjectID);
                }
            }
            Response.Write(strNewAttachIds);
        }
        catch (Exception err)
        {
            OThinker.H3.Controllers.AppUtility.Engine.LogWriter.Write("NTKO Attachment ERROR:" + err.ToString());
        }
    }
}