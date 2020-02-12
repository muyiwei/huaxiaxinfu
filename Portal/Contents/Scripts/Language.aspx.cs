using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Xml;

namespace OThinker.H3.Portal.PortalService
{
    public partial class Language : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            Response.ContentType = "application/javascript";

            Dictionary<string, string> dict = PortalPageCloud.GetCurrentLanguages(this);
            if (dict == null || dict == default(Dictionary<string, string>) || dict.Count == 0)
                return;
            Response.Write("var OT_Portal_Language = " + new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(dict) + ";");

            //string deflang = System.Configuration.ConfigurationManager.AppSettings["OT_Portal_DefaultLanguage"];
            //if (string.IsNullOrEmpty(deflang)) deflang = "zh-CN";

            //string clientlang = deflang;
            //if (Request.UserLanguages.Length > 0) clientlang = Request.UserLanguages[0];
            ////TODO:如果数据库中有定义，从这里取得
            //string langfile = Server.MapPath(System.IO.Path.Combine(Request.ApplicationPath, "Contents/Languages", clientlang + ".xml"));
            //if(!System.IO.File.Exists(langfile))
            //    langfile = Server.MapPath(System.IO.Path.Combine(Request.ApplicationPath, "Contents/Languages", deflang + ".xml"));
            //if (!System.IO.File.Exists(langfile))
            //    return;
            ////检查缓存
            //if (!PortalCache<string, string, Dictionary<string, string>>.Instance.FindItem(PortalConst.CacheName_Language).IsExists(langfile))
            //{
            //    try
            //    {
            //        System.Xml.XmlDocument xdoc = new System.Xml.XmlDocument();
            //        xdoc.Load(langfile);
            //        Dictionary<string, string> dict = new Dictionary<string, string>();
            //        XmlNodeList nodelist = xdoc.SelectNodes("ot_portal_lang/resources");
            //        foreach (XmlNode node in nodelist)
            //        {
            //            dict.Add(node.Attributes["key"].Value, node.InnerText);
            //        }
            //        //保存缓存
            //        PortalCache<string, string, Dictionary<string, string>>.Instance.FindItem(PortalConst.CacheName_Language).Add(langfile, dict);
            //        Response.Write("var OT_Portal_Language = " + new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(dict) + ";");
            //    }
            //    catch
            //    {

            //    }
            //}
            //else
            //{
            //    Dictionary<string, string> dict = PortalCache<string, string, Dictionary<string, string>>.Instance.FindItem(PortalConst.CacheName_Language).FindEntity(langfile);
            //    Response.Write("var OT_Portal_Language = " + new System.Web.Script.Serialization.JavaScriptSerializer().Serialize(dict) + ";");
            //}
        }
    }
}