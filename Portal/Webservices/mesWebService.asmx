<%@ WebService Language="C#" Class="OThinker.H3.Portal.mesWebService" %>

using System;
using System.Web;
using System.Web.Services;
using System.Web.Services.Protocols;
using System.Collections.Generic;
using System.Net;
using System.Security.Cryptography.X509Certificates;
using System.Net.Security;
using System.Text;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Xml;
using System.Reflection;

namespace OThinker.H3.Portal
{
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
    // [System.Web.Script.Services.ScriptService]
    public class mesWebService : System.Web.Services.WebService
    {
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
        private string Account = "CRS279";
        private string Pwd = "CF**ldcnCRS7*#2";
        private string FromSys = "CRS279";
        private string url = "http://10.2.90.167:8001/Oa/";
        [WebMethod(Description = "推送待办消息")]
        public string SendTodo(string sendParam)
        {
            this.Engine.LogWriter.Write("推送待办消息 》sendParam=" + sendParam);
            SendParam sp = JsonConvert.DeserializeObject<SendParam>(sendParam);
            sp.Account = Account;
            sp.Pwd = Pwd;
            sp.FromSys = FromSys;
            JObject json = Post<JObject>(url + "SendTodo/", GetEntityToString(sp));
            this.Engine.LogWriter.Write("推送待办消息 》 result=" + JsonConvert.SerializeObject(json));
            return JsonConvert.SerializeObject(json);
        }
        [WebMethod(Description = "删除待办消息")]
        public string DeleteTodo(string sendParam)
        {
            this.Engine.LogWriter.Write("删除待办消息》sendParam=" + sendParam);
            SendParam2 sp = JsonConvert.DeserializeObject<SendParam2>(sendParam);
            sp.Account = Account;
            sp.Pwd = Pwd;
            sp.FromSys = FromSys;
            JObject json = Post<JObject>(url + "DeleteTodo/", GetEntityToString(sp));
            this.Engine.LogWriter.Write("删除待办消息》 result=" + JsonConvert.SerializeObject(json));
            return JsonConvert.SerializeObject(json);
        }
        [WebMethod(Description = "已办消息")]
        public string SetTodoDone(string sendParam)
        {
            this.Engine.LogWriter.Write("已办消息》sendParam=" + sendParam);
            SendParam2 sp = JsonConvert.DeserializeObject<SendParam2>(sendParam);
            sp.Account = "CRS279";
            sp.Pwd = "CF**ldcnCRS7*#2";
            sp.FromSys = "CRS279";
            JObject json = Post<JObject>(url + "SetTodoDone/", GetEntityToString(sp));
            this.Engine.LogWriter.Write("已办消息》 result=" + JsonConvert.SerializeObject(json));
            return JsonConvert.SerializeObject(json);
        }
        /// <summary>
        /// 将实体类通过反射组装成字符串
        /// </summary>
        /// <param name="t">实体类</param>
        /// <returns>组装的字符串</returns>
        public static Dictionary<string, string> GetEntityToString(Object t)
        {

            Type type = t.GetType();
            System.Reflection.PropertyInfo[] propertyInfos = type.GetProperties();
            Dictionary<string, string> dic = new Dictionary<string, string>();
            for (int i = 0; i < propertyInfos.Length; i++)
            {
                dic.Add(propertyInfos[i].Name, propertyInfos[i].GetValue(t, null) + "");
            }
            return dic;
        }

        private static bool CheckValidationResult(object sender, X509Certificate certificate, X509Chain chain, SslPolicyErrors errors)
        {
            return true; //总是接受  
        }

        private static T Post<T>(string url, IDictionary<string, string> parameters, int? timeout = null, string userAgent = "", Encoding requestEncoding = null, CookieCollection cookies = null, bool sign = true)
        {
            string DefaultUserAgent = "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.2; SV1; .NET CLR 1.1.4322; .NET CLR 2.0.50727)";
            if (string.IsNullOrEmpty(url))
            {
                throw new ArgumentNullException("url");
            }
            if (requestEncoding == null)
            {
                requestEncoding = Encoding.UTF8;
            }
            HttpWebRequest request = null;
            //如果是发送HTTPS请求  
            if (url.StartsWith("https", StringComparison.OrdinalIgnoreCase))
            {
                ServicePointManager.ServerCertificateValidationCallback = new RemoteCertificateValidationCallback(CheckValidationResult);
                request = WebRequest.Create(url) as HttpWebRequest;
                request.ProtocolVersion = HttpVersion.Version10;
            }
            else
            {
                request = WebRequest.Create(url) as HttpWebRequest;
            }
            request.Method = "POST";
            request.ContentType = "application/x-www-form-urlencoded";


            request.Headers.Set("Pragma", "no-cache");
            if (!string.IsNullOrEmpty(userAgent))
            {
                request.UserAgent = userAgent;
            }
            else
            {
                request.UserAgent = DefaultUserAgent;
            }

            if (timeout.HasValue)
            {
                request.Timeout = timeout.Value;
            }
            if (cookies != null)
            {
                request.CookieContainer = new CookieContainer();
                request.CookieContainer.Add(cookies);
            }
            //如果需要POST数据  
            if (!(parameters == null || parameters.Count == 0))
            {
                StringBuilder buffer = new StringBuilder();
                int i = 0;
                foreach (string pkey in parameters.Keys)
                {
                    if (i > 0)
                    {
                        buffer.AppendFormat("&{0}={1}", pkey, parameters[pkey]);
                    }
                    else
                    {
                        buffer.AppendFormat("{0}={1}", pkey, parameters[pkey]);
                    }
                    i++;
                }
                byte[] data = requestEncoding.GetBytes(buffer.ToString());
                Stream stream = request.GetRequestStream();
                stream.Write(data, 0, data.Length);
                stream.Close();
            }

            HttpWebResponse response = (HttpWebResponse)request.GetResponse();
            Stream streamReceive = response.GetResponseStream();
            StreamReader streamReader = new StreamReader(streamReceive, Encoding.UTF8);
            string strResult = streamReader.ReadToEnd();

            streamReader.Close();
            streamReceive.Close();
            request.Abort();
            response.Close();

            return JsonConvert.DeserializeObject<T>(strResult);
        }

        [WebMethod(Description = "test")]
        public string test()
        {
            SendParam sp = new Portal.SendParam();
            sp.Content = "http://aa.com";
            sp.DealID = "dfhjdhfjdhf";
            sp.DocCreator = "jiayong1";
            sp.Target = "jiayong1";
            sp.Title = "Title";
            sp.Operate = "1";
            sp.SendTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            return HttpPostWebService("http://h3.cfldpe.com/Portal/Webservices/mesWebService.asmx", "SendTodo", sp);
        }


        public string HttpPostWebService(string url, string method, object sp)
        {
            string result = string.Empty;
            string param = string.Empty;
            byte[] bytes = null;

            Stream writer = null;
            HttpWebRequest request = null;
            HttpWebResponse response = null;

            param = "sendParam=" + JsonConvert.SerializeObject(sp);
            bytes = Encoding.UTF8.GetBytes(param);

            request = (HttpWebRequest)WebRequest.Create(url + "/" + method);
            request.Method = "POST";
            request.ContentType = "application/x-www-form-urlencoded";
            request.ContentLength = bytes.Length;

            try
            {
                writer = request.GetRequestStream();        //获取用于写入请求数据的Stream对象
            }
            catch (Exception ex)
            {
                return "{\"IsSuccess\":false,\"Describe\":'" + ex.Message + "'}";
                //return "";
            }

            writer.Write(bytes, 0, bytes.Length);       //把参数数据写入请求数据流
            writer.Close();

            try
            {
                response = (HttpWebResponse)request.GetResponse();      //获得响应
            }
            catch (WebException ex)
            {
                return "{\"IsSuccess\":false,\"Describe\":'" + ex.Message + "'}";
            }

            #region 这种方式读取到的是一个返回的结果字符串
            Stream stream = response.GetResponseStream();        //获取响应流
            XmlTextReader Reader = new XmlTextReader(stream);
            Reader.MoveToContent();
            result = Reader.ReadInnerXml();
            #endregion

            #region 这种方式读取到的是一个Xml格式的字符串
            //StreamReader reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8);
            //result = reader.ReadToEnd();
            #endregion 

            response.Dispose();
            response.Close();

            //reader.Close();
            //reader.Dispose();

            Reader.Dispose();
            Reader.Close();

            stream.Dispose();
            stream.Close();

            return result;
        }
    }

    public class SendParam
    {
        public string Account { get; set; }
        public string Pwd { get; set; }
        public string FromSys { get; set; }
        public string DealID { get; set; }

        public string Target { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Operate { get; set; }
        public string Key { get; set; }
        public string Param1 { get; set; }
        public string DocCreator { get; set; }
        public string Level { get; set; }
        public string SendTime { get; set; }
    }

    public class SendParam2
    {
        public string Account { get; set; }
        public string Pwd { get; set; }
        public string FromSys { get; set; }
        public string DealID { get; set; }
        public string Target { get; set; }
        public string Operate { get; set; }
        public string SendTime { get; set; }
    }

    public static class ParamM
    {

        /// <summary>
        /// Model对象转换为uri网址参数形式
        /// </summary>
        /// <param name="obj">Model对象</param>
        /// <param name="url">前部分网址</param>
        /// <returns></returns>
        public static string ModelToUriParam(this object obj)
        {
            PropertyInfo[] propertis = obj.GetType().GetProperties();
            StringBuilder sb = new StringBuilder();

            foreach (var p in propertis)
            {
                var v = p.GetValue(obj, null);
                if (v == null)
                    continue;

                sb.Append(p.Name);
                sb.Append("=");
                sb.Append(HttpUtility.UrlEncode(v.ToString()));
                sb.Append("&");
            }
            sb.Remove(sb.Length - 1, 1);

            return sb.ToString();
        }
    }
}

