using OThinker.Organization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Services;
using System.Web.Services.Description;
using System.Web.Services.Protocols;

namespace OThinker.H3.Portal.Webservices
{
    /// <summary>
    /// SSOService 的摘要说明
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.None)]
    //若要允许使用 ASP.NET AJAX 从脚本中调用此 Web 服务，请取消对下行的注释。 
    // [System.Web.Script.Services.ScriptService]
    public class SSOService : System.Web.Services.WebService
    {

        public SSOService()
        {
        }
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

        /// <summary>
        /// 用户登录验证，采用统一平台用户帐号和密码进行验证
        /// </summary>
        /// <param name="SystemCode">系统编码</param>
        /// <param name="Secret">系统秘钥</param>
        /// <param name="UserName">用户帐号</param>
        /// <param name="Password">用户密码</param>
        /// <returns></returns>
        [WebMethod(Description = "用户登录验证，采用统一平台用户帐号和密码进行验证")]
        [SoapRpcMethod(Use = SoapBindingUse.Literal, Action = "http://tempuri.org/ValidateUser", RequestNamespace = "http://tempuri.org/", ResponseNamespace = "http://tempuri.org/")]
        public bool ValidateUser(string SystemCode, string Secret, string UserName, string Password)
        {
            bool result = false;
            result = this.Engine.SSOManager.ValidateSSOSystem(SystemCode, Secret);
            if (result)
            {
                result = OThinker.H3.Controllers.UserValidatorFactory.Validate(UserName, Password) != null;
            }
            if (!result)
            {
                this.Engine.LogWriter.Write("SSO.ValidateUser:false->SystemCode=" + SystemCode + ",UserName=" + UserName);
            }
            return result;
        }

        /// <summary>
        /// 根据 Token 解密得到真实的用户信息
        /// </summary>
        /// <param name="SystemCode">系统编码，由SSO服务提供</param>
        /// <param name="Secret">解密秘钥</param>
        /// <param name="Token">单点登录信息</param>
        /// <returns></returns>
        [WebMethod(Description = "根据 Token 解密得到真实的用户信息")]
        [SoapRpcMethod(Use = SoapBindingUse.Literal, Action = "http://tempuri.org/GetAuthenticationUser", RequestNamespace = "http://tempuri.org/", ResponseNamespace = "http://tempuri.org/")]
        public string GetAuthenticationUser(string SystemCode, string Secret, string Token)
        {
            string userCode = this.Engine.SSOManager.GetUserCode(SystemCode, Secret, Token);
            this.Engine.LogWriter.Write("SSO.GetAuthenticationUser->SystemCode=" + SystemCode + ",Token=" + Token + ",UserCode=" + userCode);
            return userCode;
        }

        /// <summary>
        /// 更改解密秘钥
        /// </summary>
        /// <param name="SystemCode">系统编码，由SSO服务提供</param>
        /// <param name="Secret">旧的解密秘钥</param>
        /// <param name="NewSecret">新的解密秘钥</param>
        /// <returns></returns>
        [WebMethod(Description = "更改解密秘钥")]
        [SoapRpcMethod(Use = SoapBindingUse.Literal, Action = "http://tempuri.org/UpdateSecret", RequestNamespace = "http://tempuri.org/", ResponseNamespace = "http://tempuri.org/")]
        public bool UpdateSecret(string SystemCode, string Secret, string NewSecret)
        {
            return this.Engine.SSOManager.ResetSSOSystemSecret(SystemCode, Secret, NewSecret);
        }

        /// <summary>
        /// 获取可以单点登录到其他系统的
        /// </summary>
        /// <param name="SystemCode">当前系统编码</param>
        /// <param name="Secret">系统秘钥</param>
        /// <param name="UserCode">当前已认证的系统用户帐号</param>
        /// <param name="TargetSystemCode"></param>
        /// <param name="TargetUrl"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取可以单点登录到其他系统的URL")]
        [SoapRpcMethod(Use = SoapBindingUse.Literal, Action = "http://tempuri.org/SSOSystem", RequestNamespace = "http://tempuri.org/", ResponseNamespace = "http://tempuri.org/")]
        public string SSOSystemUrl(string SystemCode, string Secret, string UserCode, string TargetSystemCode, string TargetUrl)
        {
            bool result = this.Engine.SSOManager.ValidateSSOSystem(SystemCode, Secret);
            if (!result)
            {
                this.Engine.LogWriter.Write(string.Format("SSOSystem.false,SystemCode={0},Secret={1}", SystemCode, Secret));
                return string.Empty;
            }
            string token = this.Engine.SSOManager.GetToken(SystemCode, Secret, TargetSystemCode, UserCode);
            string url = TargetUrl;
            if (string.IsNullOrEmpty(url))
            {
                SSOSystem targetSystem = this.Engine.SSOManager.GetSSOSystem(TargetSystemCode);
                if (targetSystem == null) return string.Empty;
                url = targetSystem.DefaultUrl;
            }
            if (url.IndexOf("?") > -1) url += "&Token=" + token;
            else url += "?Token=" + token;
            return url;
        }

        #region 获取组织信息，提供用户同步使用 ---------------------
        ///// <summary>
        ///// 获取公司信息
        ///// </summary>
        ///// <param name="SystemCode">系统编码</param>
        ///// <param name="Secret">系统秘钥</param>
        ///// <returns>返回公司数据(组织根节点)</returns>
        //[WebMethod(Description = "获取公司信息")]
        //public OrganizationUnit GetCompany(string SystemCode, string Secret)
        //{
        //    if (!this.Engine.SSOManager.ValidateSSOSystem(SystemCode, Secret))
        //    {
        //        throw new Exception("应用系统标示输入错误!");
        //    }
        //    OrganizationUnit company = this.Engine.Organization.Company;
        //    OrganizationUnit companyUnit = new OrganizationUnit()
        //    {
        //        ObjectID = company.ObjectID,
        //        Name = company.Name,
        //        //Code = company.Code,
        //        ManagerID = company.ManagerID,
        //        ModifiedTime = company.ModifiedTime
        //    };
        //    return companyUnit;
        //}

        ///// <summary>
        ///// 获取所有组织信息
        ///// </summary>
        ///// <param name="SystemCode">系统编码</param>
        ///// <param name="Secret">系统秘钥</param>
        ///// <returns>返回所有组织信息</returns>
        //[WebMethod(Description = "获取所有组织信息")]
        //public OrganizationUnit[] GetAllOrganizationUnit(string SystemCode, string Secret)
        //{
        //    if (!this.Engine.SSOManager.ValidateSSOSystem(SystemCode, Secret))
        //    {
        //        throw new Exception("应用系统标示输入错误!");
        //    }

        //    string companyId = this.Engine.Organization.Company.ObjectID;
        //    List<Unit> childUnits = this.Engine.Organization.GetChildUnits(companyId,
        //        UnitType.OrganizationUnit,
        //        true, State.Unspecified);
        //    if (childUnits == null) return null;
        //    OrganizationUnit[] units = new OrganizationUnit[childUnits.Count];
        //    for (int i = 0; i < childUnits.Count; i++)
        //    {
        //        units[i] = childUnits[i] as OrganizationUnit;
        //    }
        //    return units;
        //}

        ///// <summary>
        ///// 获取所有用户信息
        ///// </summary>
        ///// <param name="SystemCode">系统编码</param>
        ///// <param name="Secret">系统秘钥</param>
        ///// <returns>返回所有的用户信息数据</returns>
        //[WebMethod(Description = "获取所有用户信息")]
        //public User[] GetAllUser(string SystemCode, string Secret)
        //{
        //    if (!this.Engine.SSOManager.ValidateSSOSystem(SystemCode, Secret))
        //    {
        //        throw new Exception("应用系统标示输入错误!");
        //    }

        //    string companyId = this.Engine.Organization.Company.ObjectID;
        //    List<Unit> childUnits = this.Engine.Organization.GetChildUnits(companyId,
        //        UnitType.User,
        //        true,
        //        State.Unspecified);

        //    if (childUnits == null) return null;
        //    User[] units = new User[childUnits.Count];
        //    for (int i = 0; i < childUnits.Count; i++)
        //    {
        //        units[i] = childUnits[i] as User;
        //        units[i].Password = string.Empty;
        //        units[i].Mobile = string.Empty;
        //    }
        //    return units;
        //}
        #endregion

    }
}
