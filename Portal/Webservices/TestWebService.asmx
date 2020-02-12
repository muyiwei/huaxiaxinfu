<%@ WebService Language="C#" Class="OThinker.H3.Test.TestWebService" %>

using System;
using System.Web;
using System.Web.Services;
using System.Web.Services.Protocols;
using System.Collections.Generic;

namespace OThinker.H3.Test
{
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
    // [System.Web.Script.Services.ScriptService]
    public class TestWebService : System.Web.Services.WebService
    {

        [WebMethod]
        public string HelloWorld()
        {
            return "Hello World";
        }

        [WebMethod]
        public System.Collections.Generic.List<TestItem> GetProvince()
        {
            List<TestItem> list = new List<TestItem>();
            list.Add(new TestItem() { Code = "GUANGDONG", Name = "广东" });
            list.Add(new TestItem() { Code = "HUNAN", Name = "湖南" });
            list.Add(new TestItem() { Code = "HUBEI", Name = "湖北" });
            list.Add(new TestItem() { Code = "JIANGXI", Name = "江西" });

            return list;
        }

        [WebMethod]
        public System.Collections.Generic.List<TestItem> GetCity(TestItem tt)
        {
            List<TestItem> list = new List<TestItem>();
            if (tt.Code == "GUANGDONG")
            {
                list.Add(new TestItem() { Code = "GUANGZHOU", Name = "广州" });
                list.Add(new TestItem() { Code = "SHENZHEN", Name = "深圳" });
                
            }
            if (tt.Code == "HUNAN")
            {
                list.Add(new TestItem() { Code = "CHANGSHA", Name = "长沙" });
                list.Add(new TestItem() { Code = "CHENZHOU", Name = "郴州" });
            }
            if (tt.Code == "HUBEI")
            {
                list.Add(new TestItem() { Code = "WUHAN", Name = "武汉" });
                list.Add(new TestItem() { Code = "HUANGGANG", Name = "黄冈" });
            }
            if (tt.Code == "JIANGXI")
            {
                list.Add(new TestItem() { Code = "NANCHANG", Name = "南昌" });
                list.Add(new TestItem() { Code = "GANZHOU", Name = "赣州" });
            }

            return list;
        }

    }

    public class TestItem
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public cItem Item { get; set; }
        public List<cItem> Item2 { get; set; }
    }

    public class cItem
    {
        public string Code { get; set; }
        public string Name { get; set; }
    }

}

