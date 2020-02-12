<%@ WebHandler Language="C#" Class="OThinker.H3.Portal.EditorUploader" %>
using System;
using System.Collections;
using System.Web;
using System.IO;
using System.Globalization;
using System.Web.SessionState;

namespace OThinker.H3.Portal
{
    /// <summary>
    /// 编辑器附件上传组件
    /// </summary>
    public class EditorUploader : IHttpHandler, IRequiresSessionState
    {
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

        private string _PortalRoot = null;
        /// <summary>
        /// 获取站点名称
        /// </summary>
        public string PortalRoot
        {
            get
            {
                if (_PortalRoot == null)
                {
                    _PortalRoot = System.Configuration.ConfigurationManager.AppSettings["PortalRoot"] + string.Empty;
                    if (this._PortalRoot == string.Empty) _PortalRoot = "/Portal";
                    if (this._PortalRoot == "/") _PortalRoot = "";//为“/”时会把localhost和端口号丢失
                }
                return this._PortalRoot;
            }
        }


        /// <summary>
        /// 函数入口
        /// </summary>
        /// <param name="context"></param>
        public void ProcessRequest(HttpContext context)
        {
            // 定义允许上传的文件扩展名
            Hashtable extTable = new Hashtable();
            extTable.Add("image", "gif,jpg,jpeg,png,bmp");
            extTable.Add("flash", "swf,flv");
            extTable.Add("media", "swf,flv,mp3,wav,wma,wmv,mid,avi,mpg,asf,rm,rmvb");
            extTable.Add("file", "doc,docx,xls,xlsx,ppt,htm,html,txt,zip,rar,gz,bz2");

            // 最大文件大小
            int maxSize = 1024 * 1024; // 1M

            HttpPostedFile imgFile = context.Request.Files["imgFile"];
            if (imgFile == null)
            {
                showError(context, "请选择文件。");
            }
            // 这里存在一个问题，无效附件不会自动被清除
            string bizObjectId = context.Request["BizObjectID"] + string.Empty;
            string schemaCode = context.Request["SchemaCode"] + string.Empty;
            string userId = context.Request["UserID"] + string.Empty;
            string editorIndex = context.Request["EditorIndex"] + string.Empty;

            String dirName = context.Request.QueryString["dir"];
            if (String.IsNullOrEmpty(dirName))
            {
                dirName = "image";
            }
            if (!extTable.ContainsKey(dirName))
            {
                showError(context, "目录名不正确。");
            }

            String fileName = imgFile.FileName;
            String fileExt = Path.GetExtension(fileName).ToLower();

            if (imgFile.InputStream == null || imgFile.InputStream.Length > maxSize)
            {
                showError(context, "上传文件大小超过限制。");
            }

            if (String.IsNullOrEmpty(fileExt) || Array.IndexOf(((String)extTable[dirName]).Split(','), fileExt.Substring(1).ToLower()) == -1)
            {
                showError(context, "上传文件扩展名是不允许的扩展名。\n只允许" + ((String)extTable[dirName]) + "格式。");
            }

            byte[] contents = new byte[imgFile.ContentLength];
            imgFile.InputStream.Read(contents, 0, imgFile.ContentLength);
            OThinker.H3.Data.Attachment attachment = new OThinker.H3.Data.Attachment();
            attachment.Content = contents;
            attachment.ContentType = imgFile.ContentType;
            attachment.CreatedBy = userId;
            attachment.CreatedTime = System.DateTime.Now;
            attachment.Description = string.Empty;
            attachment.FileName = Path.GetFileName(imgFile.FileName);
            attachment.LastVersion = true;
            attachment.ModifiedBy = null;
            attachment.ModifiedTime = System.DateTime.Now;
            attachment.BizObjectSchemaCode = schemaCode;
            attachment.BizObjectId = string.IsNullOrEmpty(bizObjectId) ? schemaCode : bizObjectId;
            string attachmentId = OThinker.H3.Controllers.AppUtility.Engine.BizObjectManager.AddAttachment(attachment);

            string downloadUrl = Path.Combine("http://"+context.Request.Url.Authority, this.PortalRoot);
            downloadUrl += string.Format( "/ReadAttachment/Read?AttachmentID={0}", attachmentId);

            context.Response.Write(JSSerializer.Serialize(new
            {
                error = 0,
                url = downloadUrl,
                editorIndex = editorIndex,
                contentType = "text/html; charset=UTF-8"
            }));
            context.Response.End();
        }

        /// <summary>
        /// 显示错误
        /// </summary>
        /// <param name="context"></param>
        /// <param name="message"></param>
        private void showError(HttpContext context, string message)
        {
            context.Response.Write(JSSerializer.Serialize(new
            {
                error = 1,
                message = message,
                contentType = "text/html; charset=UTF-8"
            }));
            context.Response.End();
        }

        /// <summary>
        /// 覆盖基类方法
        /// </summary>
        public bool IsReusable
        {
            get
            {
                return true;
            }
        }

    }
}