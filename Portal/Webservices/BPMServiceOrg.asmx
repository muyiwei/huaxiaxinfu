<%@ WebService Language="C#" Class="OThinker.H3.Portal.BPMServiceOrg" %>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Services;
using System.Data;
using OThinker.H3.Acl;
using OThinker.H3.WorkflowTemplate;

namespace OThinker.H3.Portal
{
    /// <summary>
    /// 流程实例操作相关接口
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.None)]
    //若要允许使用 ASP.NET AJAX 从脚本中调用此 Web 服务，请取消对下行的注释。 
    // [System.Web.Script.Services.ScriptService]
    public class BPMServiceOrg : System.Web.Services.WebService
    {
        /// <summary>
        /// 
        /// </summary>
        public BPMServiceOrg()
        {
            //如果使用设计的组件，请取消注释以下行 
            //InitializeComponent(); 
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
        /// 查询对象
        /// </summary>
        protected Query Query
        {
            get
            {
                return this.Engine.Query;
            }
        }

        private System.Web.Script.Serialization.JavaScriptSerializer _JsSerializer = null;
        /// <summary>
        /// 获取JS序列化对象
        /// </summary>
        private System.Web.Script.Serialization.JavaScriptSerializer JSSerializer
        {
            get
            {
                if (_JsSerializer == null)
                {
                    _JsSerializer = new System.Web.Script.Serialization.JavaScriptSerializer();
                }
                return _JsSerializer;
            }
        }

        private void AddUserMethod()
        {
            //构造用户实例类型
            Organization.User user1 = new Organization.User();
            //用户表中的objectid
            user1.ObjectID = Guid.NewGuid().ToString();
            //用户名称
            user1.Name = "测试8899";
            //其他一些不必要属性，例如生日，电话等等
            user1.Mobile = "";
            //组织机构ID
            user1.ParentID = "18f923a7-5a5e-426d-94ae-a55ad1a4b240";
            //用户登陆CODE ,必须唯一
            user1.Code = "ceshi8899";
            //状态
            user1.State = Organization.State.Active;
            //新增用户函数接口
            this.Engine.Organization.AddUnit(createUserId, user1);
        }




        string hxxfConfig = System.Configuration.ConfigurationManager.AppSettings["hxxf"] + string.Empty;
        /// <summary>
        /// 获取组织机构信息
        /// </summary>
        /// <returns></returns>
        public string SyncOrgList()
        {
            var DataSet = SqlHelper.ExecuteDataset(hxxfConfig, CommandType.Text, "select  id, parentid, setid, deptid, fullname, shortname, effectivedate, effectivestatus, isintree, managerid, managerpositionid, departmentclass, datasource, fullpathcode, fullpathtext, innerorder, dictorgtype, masterdata_batchtime, masterdata_datastatus, masterdata_result from UdmOrganization where EffectiveStatus='A'");
            if (DataSet != null && DataSet.Tables != null && DataSet.Tables.Count > 0)
            {
                var dataTable = DataSet.Tables[0];
                foreach (DataRow item in dataTable.Rows)
                {
                    this.Engine.Organization.AddUnit("18f923a7-5a5e-426d-94ae-a55ad1a4b239", new OThinker.Organization.OrganizationUnit()
                    {
                        ObjectID = (item["Id"] + string.Empty).ToLower(),
                        Name = item["ShortName"] + string.Empty,
                        ManagerID = item["ManagerId"] + string.Empty,
                        CreatedTime = DateTime.Parse(item["MASTERDATA_BATCHTIME"] + string.Empty),
                        //SortKey = int.Parse(string.IsNullOrEmpty(item["InnerOrder"] + string.Empty) ? "0" : item["InnerOrder"] + string.Empty),
                        ParentID = string.IsNullOrEmpty(item["ParentId"] + string.Empty) ? "18f923a7-5a5e-426d-94ae-a55ad1a4b240" : (item["ParentId"] + string.Empty).ToLower(),
                        State = GetOrgSate(item["EffectiveStatus"] + string.Empty),

                    });
                }
            }
            return "";
        }
        /// <summary>
        /// 获取当前用户所有可用岗位信息
        /// </summary>
        /// <returns></returns>
        public DataTable GetUdmJobInfo(string userid)
        {
            var DataSet = SqlHelper.ExecuteDataset(hxxfConfig, CommandType.Text, " select * from UDMJOB where USERID='" + userid + "' and MASTERDATA_DATASTATUS='A' AND DictPositionStatus='A'");
            if (DataSet != null && DataSet.Tables != null && DataSet.Tables.Count > 0)
            {
                return DataSet.Tables[0];
            }
            return null;
        }
        /// <summary>
        /// 获取当前用户最新一条主岗信息
        /// </summary>
        /// <returns></returns>
        public DataTable GetUdmJobMaininfo(string userid)
        {
            var DataSet = SqlHelper.ExecuteDataset(hxxfConfig, CommandType.Text, " select TOP 1 * from UDMJOB where USERID='" + userid + "' AND  JobIndicate='P'  order by MASTERDATA_BATCHTIME DESC ");
            if (DataSet != null && DataSet.Tables != null && DataSet.Tables.Count > 0)
            {
                return DataSet.Tables[0];
            }
            return null;
        }
        /// <summary>
        /// 获取用户信息
        /// </summary>
        /// <returns></returns>
        public string SyncUserList()
        {
            var DataSet = SqlHelper.ExecuteDataset(hxxfConfig, CommandType.Text, "select * from UdmUser a where a.MASTERDATA_DATASTATUS='A' ");
            if (DataSet != null && DataSet.Tables != null && DataSet.Tables.Count > 0)
            {
                var dataTable = DataSet.Tables[0];

                foreach (DataRow item in dataTable.Rows)
                {
                    var serviceFlag = false;
                    //当前用户所有可用岗位信息
                    var allJob = GetUdmJobInfo(item["Id"] + string.Empty);
                    //主岗
                    var row = allJob.AsEnumerable().Where(r => r["JobIndicate"] + string.Empty == "P").ToArray();
                    if (row == null || row.Count() < 1)
                    {
                        //当前用户无岗位信息，但是用户依然有效的情况下MASTERDATA_DATASTATUS=A，找出最近一条被禁用或者无效主岗位信息，并设置用户H3在职状态为离职
                        var allMainJob = GetUdmJobMaininfo(item["Id"] + string.Empty);
                        serviceFlag = true;
                        row = allMainJob.AsEnumerable().Where(r => r["JobIndicate"] + string.Empty == "P").ToArray();
                    }
                    if (row == null || row.Count() < 1)
                    {
                        this.Engine.LogWriter.Write("当前用户的没有主岗记录，无法挂载在组织机构下：" + item["LoginName"] + string.Empty);
                        continue;
                    }
                    //添加用户OR更新用户
                    Organization.User myUnit = this.Engine.Organization.GetUserByCode(item["LoginName"] + string.Empty);
                    if (myUnit != null)
                    {
                        myUnit.ObjectID = (item["Id"] + string.Empty).ToLower();
                        myUnit.EmployeeNumber = item["EemployeeId"] + string.Empty;
                        myUnit.Gender = GetGender(item["Gender"] + string.Empty);
                        myUnit.Name = item["FullName"] + string.Empty;
                        myUnit.ManagerID = (row[0]["ManagerId"] + string.Empty).ToLower();
                        myUnit.CreatedTime = DateTime.Now;
                        myUnit.Email = item["Email"] + string.Empty;
                        myUnit.Birthday = DateTime.Parse(item["Birthday"] + string.Empty);
                        myUnit.Mobile = item["HomePhone"] + string.Empty;
                        myUnit.OfficePhone = item["Phone"] + string.Empty;
                        myUnit.Code = item["LoginName"] + string.Empty;
                        myUnit.IDNumber = item["IDCardNumber"] + string.Empty;
                        myUnit.EntryDate = DateTime.Parse(item["HireTime"] + string.Empty);
                        //myUnit.SortKey = int.Parse(string.IsNullOrEmpty(item["OrderBy"] + string.Empty) ? "0" : item["OrderBy"] + string.Empty);
                        myUnit.ParentID = (row[0]["OrganizationId"] + string.Empty).ToLower();
                        myUnit.State = GetOrgSate(item["MASTERDATA_DATASTATUS"] + string.Empty);
                        //无可用主岗记录，当前用户状态应为离职
                        if (serviceFlag)
                        {
                            myUnit.ServiceState = Organization.UserServiceState.Dismissed;
                        }
                        else
                        {
                            myUnit.ServiceState = GetServiceState(row[0]["DictPositionStatus"] + string.Empty);
                        }

                        Organization.HandleResult results = this.Engine.Organization.UpdateUnit(createUserId, myUnit);

                    }
                    else
                    {

                        OThinker.Organization.User newUser = new OThinker.Organization.User();
                        newUser.ObjectID = (item["Id"] + string.Empty).ToLower();
                        newUser.EmployeeNumber = item["EemployeeId"] + string.Empty;
                        newUser.Gender = GetGender(item["Gender"] + string.Empty);
                        newUser.Name = item["FullName"] + string.Empty;
                        newUser.ManagerID = row[0]["ManagerId"] + string.Empty.ToLower();
                        newUser.CreatedTime = DateTime.Now;
                        newUser.Email = item["Email"] + string.Empty;
                        newUser.Birthday = DateTime.Parse(string.IsNullOrEmpty(item["Birthday"] + string.Empty) ? DateTime.Now.ToShortDateString() : item["Birthday"] + string.Empty);
                        newUser.Mobile = item["HomePhone"] + string.Empty;
                        newUser.OfficePhone = item["Phone"] + string.Empty;
                        newUser.Code = item["LoginName"] + string.Empty;
                        newUser.IDNumber = item["IDCardNumber"] + string.Empty;
                        newUser.EntryDate = DateTime.Parse(string.IsNullOrEmpty(item["HireTime"] + string.Empty) ? DateTime.Now.ToShortDateString() : item["HireTime"] + string.Empty);
                        // SortKey =  int.Parse(string.IsNullOrEmpty(item["OrderBy"] + string.Empty) ? "0" : item["OrderBy"] + string.Empty),
                        //把人挂在主岗部门下
                        newUser.ParentID = (row[0]["OrganizationId"] + string.Empty).ToLower();
                        newUser.State = GetOrgSate(item["MASTERDATA_DATASTATUS"] + string.Empty);
                        //无可用主岗记录，当前用户状态应为
                        //无可用主岗记录，当前用户状态应为离职
                        if (serviceFlag)
                        {
                            newUser.ServiceState = Organization.UserServiceState.Dismissed;
                        }
                        else
                        {
                            newUser.ServiceState = GetServiceState(row[0]["DictPositionStatus"] + string.Empty);
                        }
                        this.Engine.Organization.AddUnit("18f923a7-5a5e-426d-94ae-a55ad1a4b239", newUser);

                    }
                    SyncRoleInfo(allJob);

                }

            }
            return "";
        }

        /// <summary>
        /// 同步角色内部人员信息及管理范围信息
        /// </summary>
        /// <returns></returns>
        public string SyncRoleInfo(DataTable alljob)
        {
            foreach (DataRow item in alljob.Rows)
            {
                    //岗位ID不为空
                if (!string.IsNullOrEmpty((item["PositionId"] + string.Empty).Trim()))
                {
                    Organization.OrgPost orgPost = this.Engine.Organization.GetJobByCode(item["PositionId"] + string.Empty);
                    SaveRoleUsers(orgPost, item["USERID"] + string.Empty, item["OrganizationId"] + string.Empty, "", false);
                }
            }
            return "";
        }

        /// <summary>
        /// 新增角色(岗位)，一人多岗形式以角色存储
        /// </summary>
        /// <returns></returns>
        public string SyncRoleList()
        {
            var DataSet = SqlHelper.ExecuteDataset(hxxfConfig, CommandType.Text, " select Id,PositionId,PositionName from UdmPosition where EFFECTIVESTATUS='A' ");
            if (DataSet != null && DataSet.Tables != null && DataSet.Tables.Count > 0)
            {
                foreach (DataRow item in DataSet.Tables[0].Rows)
                {
                    string postGuid = Guid.NewGuid().ToString();
                    Organization.OrgPost post = new Organization.OrgPost()
                    {
                        Code = item["Id"] + string.Empty,
                        Name = item["PositionName"] + string.Empty,
                        SuperiorID = "",
                        Description = "",
                        SortKey = 1,
                        JobLevel = 1,
                        ObjectID = (item["Id"] + string.Empty).ToLower(),
                    };
                    OThinker.H3.Controllers.Service.OrganizationService.OrganizationService organizationService = new Controllers.Service.OrganizationService.OrganizationService();
                    bool isAdd = organizationService.SaveUnit("18f923a7-5a5e-426d-94ae-a55ad1a4b239", post, true);
                }
            }
            return "";
        }

        /// <summary>
        /// 获取用户性别
        /// </summary>
        /// <returns></returns>
        public Organization.UserGender GetGender(string gender)
        {
            var temp = Organization.UserGender.Male;
            switch (gender)
            {
                case "M":
                    temp = Organization.UserGender.Male;
                    break;
                case "F":
                    temp = Organization.UserGender.Female;
                    break;
                case "U":
                    temp = Organization.UserGender.None;
                    break;

            }
            return temp;
        }
        /// <summary>
        /// 获取组织启用状态
        /// </summary>
        /// <returns></returns>
        public Organization.State GetOrgSate(string orgSate)
        {
            var temp = Organization.State.Active;
            switch (orgSate)
            {
                case "A":
                    temp = Organization.State.Active;
                    break;
                case "I":
                    temp = Organization.State.Inactive;
                    break;
                default:
                    temp = Organization.State.Unspecified;
                    break;
            }
            return temp;
        }
        /// <summary>
        /// 获取在职状态
        /// </summary>
        /// <returns></returns>
        public Organization.UserServiceState GetServiceState(string orgSate)
        {
            var temp = Organization.UserServiceState.Intern;
            switch (orgSate)
            {
                case "A":
                    temp = Organization.UserServiceState.InService;
                    break;
                case "I":
                    temp = Organization.UserServiceState.Dismissed;
                    break;
                default:
                    //实习
                    temp = Organization.UserServiceState.Intern;
                    break;
            }
            return temp;
        }
        /// <summary>
        /// 获取可以直接使用浏览器打开的附件类型
        /// </summary>
        protected string Browse_Extension = ".pdf,.jpg,.gif,.jpeg,.png";
        public string createUserId = "18f923a7-5a5e-426d-94ae-a55ad1a4b239";
        /// <summary>
        /// 华夏幸福组织机构同步
        /// </summary>
        [WebMethod(Description = "同步华夏幸福人员及组织机构")]
        public string SyncUserAndOrgnazationUnit()
        {
            //同步组织
             SyncOrgList();
            //同步岗位
            SyncRoleList();
            //同步人员
            SyncUserList();


            return "";
            //获取华夏幸福组织及人员
            //Dictionary<string, List<childreanUint>> resultOrgList = ReadExelFileToBpmOrginate(savePath);
            ////所有部门ID
            //Dictionary<string, string> objectid = new Dictionary<string, string>();
            ////调用接口插入到H3库中
            //foreach (string item in resultOrgList.Keys)
            //{
            //    string guid = Guid.NewGuid().ToString();
            //    //新增一级组织
            //    this.Engine.Organization.AddUnit("18f923a7-5a5e-426d-94ae-a55ad1a4b239", new OThinker.Organization.OrganizationUnit()
            //    {
            //        DingTalkID = 0,
            //        ObjectID = guid,
            //        Name = item,
            //        ParentID = "18f923a7-5a5e-426d-94ae-a55ad1a4b240",
            //        ManagerID = ""
            //    });
            //    foreach (childreanUint Childitem in resultOrgList[item])
            //    {
            //        string childreanGuid = Guid.NewGuid().ToString();
            //        //新增二级组织
            //        this.Engine.Organization.AddUnit("18f923a7-5a5e-426d-94ae-a55ad1a4b239", new OThinker.Organization.OrganizationUnit()
            //        {
            //            DingTalkID = 000000,
            //            ObjectID = childreanGuid,
            //            Name = Childitem.Cname,
            //            ParentID = guid,
            //            ManagerID = ""
            //        });
            //        if (!objectid.ContainsKey(Childitem.Cname.Trim()))
            //        {
            //            objectid.Add(Childitem.Cname.Trim(), childreanGuid.Trim());
            //        }
            //    }
            //    if (!objectid.ContainsKey(item.Trim()))
            //    {
            //        objectid.Add(item.Trim(), guid.Trim());
            //    }
            //}
            ////新增角色
            //string postGuid = Guid.NewGuid().ToString();
            //Organization.OrgPost post = new Organization.OrgPost()
            //{
            //    Code = "bmjl",
            //    Name = "部门经理",
            //    SuperiorID = "",
            //    Description = "",
            //    SortKey = 1,
            //    JobLevel = 1,
            //    ObjectID = postGuid
            //};
            //OThinker.H3.Controllers.Service.OrganizationService.OrganizationService organizationService = new Controllers.Service.OrganizationService.OrganizationService();
            //bool isAdd = organizationService.SaveUnit("18f923a7-5a5e-426d-94ae-a55ad1a4b239", post, true);

            //OThinker.H3.Controllers.Service.OrganizationService.OrganizationService organizationService = new Controllers.Service.OrganizationService.OrganizationService();
            //Organization.OrgPost bmjl = this.Engine.Organization.GetJobByCode("bmjl"); //部门经理
            //Organization.OrgPost zxjl = this.Engine.Organization.GetJobByCode("zxjl"); //中心经理
            //bool flag = false;
            //if (string.IsNullOrEmpty(bmjl.Code))
            //{
            //    flag = true;
            //    //新增角色
            //    string postGuidBM = Guid.NewGuid().ToString();
            //    bmjl = new Organization.OrgPost()
            //    {
            //        Code = "bmjl",
            //        Name = "部门经理",
            //        SuperiorID = "",
            //        Description = "",
            //        SortKey = 1,
            //        JobLevel = 1,
            //        ObjectID = postGuidBM
            //    };
            //    organizationService.SaveUnit(createUserId, bmjl, true);
            //}
            ////新增角色
            //if (string.IsNullOrEmpty(zxjl.Code))
            //{
            //    flag = true;
            //    string postGuidzx = Guid.NewGuid().ToString();
            //    zxjl = new Organization.OrgPost()
            //    {
            //        Code = "zxjl",
            //        Name = "中心经理",
            //        SuperiorID = "",
            //        Description = "",
            //        SortKey = 1,
            //        JobLevel = 1,
            //        ObjectID = postGuidzx
            //    };
            //    organizationService.SaveUnit(createUserId, zxjl, true);
            //}
            //string companyId = this.Engine.Organization.Company.ObjectID;
            //List<Organization.Unit> units = this.Engine.Organization.GetChildUnits(companyId, Organization.UnitType.OrganizationUnit, true, Organization.State.Active);
            //获取附件中的用户信息,设置对应的消息
            //List<childreanUser> resultUserList = ReadExelFileToBpmUser(savePath);
            //foreach (childreanUser itemChildrean in resultUserList)
            //{
            //    if (!units.Any(s => s.Name.Trim() == itemChildrean.department.Trim()))
            //    {
            //        break;
            //    }
            //    string parentId = units.First(s => s.Name.Trim() == itemChildrean.department.Trim()).ObjectID;
            //    Organization.User user = this.Engine.Organization.GetUserByCode(itemChildrean.telPhone);

            //    string userGuid = Guid.NewGuid().ToString();
            //    if (user != null)   //添加用户OR更新用户
            //    {
            //        //   user.ParentID = parentId;

            //        //先获取再更新
            //        Organization.Unit myUnit = this.Engine.Organization.GetUnit(user.UnitID);
            //        myUnit.ParentID = parentId;
            //        Organization.HandleResult results = this.Engine.Organization.UpdateUnit(createUserId, myUnit);
            //        //this.un
            //        //bool SS=    this.SetItemValue(createUserId, "OT_User", user.ObjectID, "ParentID", "11111111");
            //    }
            //    else
            //    {
            //        Organization.User user1 = new Organization.User();
            //        user1.ObjectID = userGuid;
            //        user1.Name = itemChildrean.Cname;
            //        user1.Mobile = itemChildrean.telPhone;
            //        user1.ParentID = parentId;
            //        user1.Code = itemChildrean.telPhone;
            //        user1.State = Organization.State.Active;
            //        this.Engine.Organization.AddUnit(createUserId, user1);
            //    }
            //    if (itemChildrean.remark.Contains("部门经理") || itemChildrean.remark.Contains("部门副经理"))
            //    {
            //        SaveRoleUsers(bmjl, userGuid, parentId, createUserId, flag);
            //    }
            //    else if (itemChildrean.remark.Contains("中心经理") || itemChildrean.remark.Contains("中心副经理"))
            //    {
            //        SaveRoleUsers(zxjl, userGuid, parentId, createUserId, flag);
            //    }
            //}
            //return null;
        }

        /// <summary>
        /// 角色信息保存
        /// </summary>
        /// <param name="post"></param>
        /// <param name="userId"></param>
        /// <param name="scopeid"></param>
        /// <param name="createUser"></param>
        private void SaveRoleUsers(Organization.OrgPost post, string userId, string scopeid, string createUser, bool isNew)
        {
            OThinker.H3.Controllers.Service.OrganizationService.OrganizationService organizationService = new Controllers.Service.OrganizationService.OrganizationService();

            //if (!isNew)
            //{
            //    //if (post.ChildList.ToList().Any(s => s.UserID == userId))
            //    //{
            //    OThinker.H3.Controllers.ViewModels.RoleUserViewModel roleuserviewmodel = new Controllers.ViewModels.RoleUserViewModel();
            //    roleuserviewmodel.ManagerScopeIds = scopeid;
            //    roleuserviewmodel.RoleID = post.ObjectID;
            //    roleuserviewmodel.UserID = userId;
            //    roleuserviewmodel.ObjectID = Guid.NewGuid().ToString();//post.ChildList.ToList().First(s => s.UserID == userId).ObjectID;
            //                                                           //       Organization.OrgPost mypost = organizationService.GetUnit(post.ObjectID) as Organization.OrgPost;
            //    Organization.OrgStaff orgstaff = new Organization.OrgStaff();
            //    orgstaff.ObjectID = Guid.NewGuid().ToString(); //post.ChildList.ToList().First(s => s.UserID == userId).ObjectID;
            //    orgstaff.UserID = userId;
            //    orgstaff.OUScope = new string[] { scopeid };
            //    post.UpdateChildUnit(orgstaff);
            //    var result = organizationService.SaveOrgStaff(roleuserviewmodel, post, new string[] { userId + ";" });
            //    if (result.Success)
            //    {
            //        var resultState = organizationService.SaveUnit(createUserId, post, false);
            //    }
            //    //}
            //}
            //else
            //{
            OThinker.H3.Controllers.ViewModels.RoleUserViewModel roleuserviewmodel = new Controllers.ViewModels.RoleUserViewModel();
            roleuserviewmodel.ManagerScopeIds = scopeid;
            roleuserviewmodel.RoleID = post.ObjectID;
            roleuserviewmodel.UserID = userId;
            roleuserviewmodel.ObjectID = Guid.NewGuid().ToString();

            Organization.OrgPost mypost = organizationService.GetUnit(post.ObjectID) as Organization.OrgPost;
            if (mypost == null)
            {
                mypost = post;
            }
            Organization.OrgStaff orgstaff = new Organization.OrgStaff();
            orgstaff.ObjectID = Guid.NewGuid().ToString();
            orgstaff.UserID = userId;
            orgstaff.OUScope = new string[] { scopeid };
            mypost.AddChildUnit(orgstaff);
            var result = organizationService.SaveOrgStaff(roleuserviewmodel, mypost, new string[] { userId + ";" });
            if (result.Success)
            {
                var resultState = organizationService.SaveUnit(createUserId, mypost, false);
            }
            //}
            return;
            try
            {
                //if (post != null)
                //{
                //    if (userId != null)
                //    {
                //        OThinker.Organization.OrgStaff staff = new OThinker.Organization.OrgStaff()
                //        {
                //            OUScope = new string[] { scopeid },
                //            UserID = userId,
                //            ParentObjectID = post.ObjectID,
                //            Description = string.Empty
                //        };
                //        if (post.ChildList.ToList().Any(s => s.UserID == userId))
                //        {
                //            staff.ObjectID = post.ChildList.ToList().First(s => s.UserID == userId).ObjectID;
                //            post.UpdateChildUnit(staff);
                //        }
                //        else
                //        {
                //            staff.ObjectID = Guid.NewGuid().ToString();
                //            post.AddChildUnit(staff);
                //        }

                //    }
                //}
            }
            catch (Exception ex)
            {
                this.Engine.LogWriter.Write(string.Format("[H3BPM]->ERROR->{0}", ex.Message));
            }
        }

        /// <summary>
        /// 根据名称获取对应组织的ObjectID
        /// </summary>
        /// <param name="name"></param>
        /// <returns></returns>
        private string GetUnitIdByName(string name)
        {
            string companyId = this.Engine.Organization.Company.ObjectID;
            List<Organization.Unit> units = this.Engine.Organization.GetChildUnits(companyId, Organization.UnitType.OrganizationUnit, true, Organization.State.Active);
            string sql = string.Format("SELECT TOP(1) ObjectId FROM OT_OrganizationUnit WHERE name = '{0}'", name);
            return this.Engine.Query.CommandFactory.CreateCommand().ExecuteScalar(sql) + string.Empty;
        }
        /// <summary>
        /// 读取excel文件中用户的内容到BPM
        /// </summary>
        private List<childreanUser> ReadExelFileToBpmUser(string filePath)
        {
            return null;
            ////读取excel中的文件到内存，再调用bpm接口插入人员表
            //ExcelHelpers excelHelp = new ExcelHelpers(filePath);
            //DataTable sbxa = excelHelp.ExcelToDataTable("人员明细", true);
            ////解析excel里面的值
            //List<childreanUser> userLists = new List<childreanUser>();
            //foreach (DataRow item in sbxa.Rows)
            //{
            //    if (!string.IsNullOrEmpty(item["部门"].ToString()) && !string.IsNullOrEmpty(item["姓名"].ToString()) &&
            //            !string.IsNullOrEmpty(item["手机号"].ToString()))
            //    {
            //        childreanUser childreanuser = new childreanUser();
            //        childreanuser.Cname = (item["姓名"] + string.Empty).Trim();
            //        childreanuser.department = (item["部门"] + string.Empty).Trim();
            //        childreanuser.telPhone = (item["手机号"] + string.Empty).Trim();
            //        childreanuser.remark = (item["备注"] + string.Empty).Trim();
            //        userLists.Add(childreanuser);
            //    }
            //}
            //return userLists;
        }


        /// <summary>
        /// 读取excel文件中的内容到BPM
        /// </summary>
        private Dictionary<string, List<childreanUint>> ReadExelFileToBpmOrginate(string filePath)
        {
            return null;
            ////读取excel中的文件到内存，再调用bpm接口插入组织机构
            //ExcelHelpers excelHelp = new ExcelHelpers(filePath);
            //DataTable sbxa = excelHelp.ExcelToDataTable("组织机构", true);
            ////解析excel里面的值
            //Dictionary<string, List<childreanUint>> orgList = new Dictionary<string, List<childreanUint>>();
            //foreach (DataRow item in sbxa.Rows)
            //{
            //    OrginateUnit sbltObject = new OrginateUnit();
            //    List<childreanUint> childreanList = new List<childreanUint>();
            //    if (!string.IsNullOrEmpty(item["一级部门"].ToString()) && string.IsNullOrEmpty(item["下属中心"].ToString()))
            //    {
            //        sbltObject.name = item["一级部门"] + string.Empty;
            //        sbltObject.childreanList = null;
            //        sbltObject.objectid = Guid.NewGuid().ToString();
            //    }
            //    else if (!string.IsNullOrEmpty(item["一级部门"].ToString()) && !string.IsNullOrEmpty(item["下属中心"].ToString()))
            //    {
            //        //存在子集
            //        sbltObject.name = item["一级部门"] + string.Empty;
            //        sbltObject.objectid = Guid.NewGuid().ToString();


            //        if (orgList.ContainsKey(sbltObject.name))
            //        {
            //            childreanList = orgList[sbltObject.name];
            //            childreanUint childreanS = new childreanUint();
            //            childreanS.Cname = item["下属中心"].ToString();
            //            childreanS.Cobjectid = Guid.NewGuid().ToString();
            //            childreanList.Add(childreanS);
            //        }
            //        else
            //        {
            //            childreanUint childreanSe = new childreanUint();
            //            childreanSe.Cname = item["下属中心"].ToString();
            //            childreanSe.Cobjectid = Guid.NewGuid().ToString();
            //            childreanList.Add(childreanSe);
            //        }
            //    }
            //    if (!orgList.ContainsKey(sbltObject.name))
            //    {
            //        orgList.Add(sbltObject.name, childreanList);
            //    }
            //}
            //return orgList;
        }
        /// <summary>
        /// 组织机构类
        /// </summary>
        public class OrginateUnit
        {
            public string name { get; set; }
            public string objectid { get; set; }
            public List<childreanUint> childreanList { get; set; }
        }
        /// <summary>
        /// 部门子集
        /// </summary>
        public class childreanUint
        {
            public string Cname { get; set; }
            public string Cobjectid { get; set; }
            public string parentid { get; set; }
        }
        /// <summary>
        /// 人员子集
        /// </summary>
        public class childreanUser
        {
            public string Cname { get; set; }
            public string Cobjectid { get; set; }
            public string parentid { get; set; }
            public string department { get; set; }
            public string telPhone { get; set; }
            public string remark { get; set; }
        }
        /// <summary>
        /// 人员子集
        /// </summary>
        public class MyPost
        {

            public string Code { get; set; }
            public string Name { get; set; }
            public string SuperiorID { get; set; }
            public string Description { get; set; }
            public int SortKey { get; set; }
            public int JobLevel { get; set; }
        }


        /// <summary>
        /// 获取2个日期之间的总天数
        /// </summary>
        /// <param name="StartDate"></param>
        /// <param name="EndDate"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取2个日期之间的天数")]
        public double GetDays(DateTime StartDate, DateTime EndDate)
        {
            bool existsDefault = this.Engine.WorkingCalendarManager.ExistsDefaultCalendar();
            if (existsDefault)
            {
                TimeSpan span = this.Engine.WorkingCalendarManager.GetUsedTimeByCompanyCalendar(StartDate, EndDate);
                return span.TotalHours / 8;
            }
            return EndDate.Subtract(StartDate).Days;
        }

        [WebMethod(Description = "获取发起流程模板")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public string GetWorkfowNodeByUser(string UserCode,
            bool ShowFavorite = true,
            bool IsMobile = false,
            string ParentCode = "",
            string SearchKey = "")
        {
            ValidateSoapHeader();

            string Mode = "WorkflowTemplate";

            var CurrentUserValidator = OThinker.H3.Controllers.UserValidatorFactory.GetUserValidator(this.Engine, UserCode);
            if (CurrentUserValidator == null) { return null; }

            OThinker.H3.Controllers.WorkflowController workflowCtrl = new Controllers.WorkflowController();

            //获取所有有权限发起的流程模板
            DataTable dtworkflows = Engine.PortalQuery.QueryWorkflow(CurrentUserValidator.RecursiveMemberOfs, CurrentUserValidator.ValidateAdministrator());
            //根据可以发起的流程模板编码，倒推获取所有的节点集合
            List<string> aclWorkflowCodes = new List<string>();
            foreach (DataRow row in dtworkflows.Rows)
            {
                if (aclWorkflowCodes.Contains(row[WorkItem.WorkItem.PropertyName_WorkflowCode].ToString())) continue;
                aclWorkflowCodes.Add(row[WorkItem.WorkItem.PropertyName_WorkflowCode] + string.Empty);
            }
            //FunctionAclManager
            List<FunctionNode> nodes = Engine.WorkflowManager.GetParentNodesByWorkflowCodes(aclWorkflowCodes);
            //获取所有的流程模板头，用于获取发布时间
            //WorkflowTemplateManager
            Dictionary<string, PublishedWorkflowTemplateHeader> dicHeaders = Engine.WorkflowManager.GetDefaultWorkflowHeaders(aclWorkflowCodes.ToArray());
            List<PublishedWorkflowTemplateHeader> headers = new List<PublishedWorkflowTemplateHeader>();
            //移动端可发起的流程编码
            List<string> mobileVisibleWorkflowCodes = new List<string>();
            //图标集<WorkflowCode.ImagePath>
            Dictionary<string, string> workflowIcons = new Dictionary<string, string>();
            Dictionary<string, string> workflowIconFileNames = new Dictionary<string, string>();

            if (IsMobile)
            {
                #region 手机端 --------------
                // 检测是否允许手机端发起
                List<string> lstSchemaCodes = new List<string>();
                foreach (PublishedWorkflowTemplateHeader header in dicHeaders.Values)
                {
                    if (!lstSchemaCodes.Contains(header.BizObjectSchemaCode.ToLower()))
                    {
                        lstSchemaCodes.Add(header.BizObjectSchemaCode.ToLower());
                    }
                }
                Dictionary<string, WorkflowClause[]> dicClauses = this.Engine.WorkflowManager.GetClausesBySchemaCodes(lstSchemaCodes.ToArray());
                foreach (string key in dicClauses.Keys)
                {
                    foreach (WorkflowClause c in dicClauses[key])
                    {
                        if (c.MobileStart && !mobileVisibleWorkflowCodes.Contains(c.WorkflowCode.ToLower()))
                        {
                            mobileVisibleWorkflowCodes.Add(c.WorkflowCode.ToLower());
                            if (!string.IsNullOrEmpty(c.IconFileName))
                            {
                                workflowIconFileNames.Add(c.WorkflowCode.ToLower(), c.IconFileName);
                            }
                            else if (!string.IsNullOrEmpty(c.Icon))
                            {
                                workflowIcons.Add(c.WorkflowCode.ToLower(), c.Icon);
                            }
                        }
                    }
                }
                #endregion
            }

            foreach (PublishedWorkflowTemplateHeader header in dicHeaders.Values)
            {
                if (!IsMobile || mobileVisibleWorkflowCodes.Contains(header.WorkflowCode.ToLower()))
                {
                    headers.Add(header);
                }
            }
            //常用流程
            List<string> favoriteWorkflowCodes = this.Engine.WorkflowConfigManager.GetFavoriteWorkflowCodes(CurrentUserValidator.UserID);
            string parentCode = string.IsNullOrEmpty(ParentCode) ? OThinker.H3.Acl.FunctionNode.Category_ProcessModel_Code : ParentCode;
            var result = workflowCtrl.GetWorkflowNodeByParentCode(
                parentCode,
                SearchKey,
                Mode == "WorkflowTemplate" ? FunctionNodeType.BizWorkflow : FunctionNodeType.BizWorkflowPackage,
                ShowFavorite,
                nodes,
                favoriteWorkflowCodes,
                aclWorkflowCodes,
                headers,
                workflowIcons,
                workflowIconFileNames);

            return JSSerializer.Serialize(result);

        }

        /// <summary>
        /// 获取用户的待办任务总数
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取用户未完成的任务总数")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public int GetUserUnfinishedWorkItemCount(string userId)
        {
            try
            {
                ValidateSoapHeader();
                int recordCounts;
                // 构造查询用户帐号的条件
                string[] conditions = Query.GetWorkItemConditions(
                    userId,
                    true,
                    H3.WorkItem.WorkItemState.Unfinished,
                    H3.WorkItem.WorkItemType.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified);

                // 获取总记录数，计算页码         
                recordCounts = this.Engine.Query.CountWorkItem(conditions);
                return recordCounts;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 获取用户的已办任务总数
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取用户已完成的任务总数")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public int GetUserFinishedWorkItemCount(string userId)
        {
            try
            {
                ValidateSoapHeader();
                int recordCounts;
                // 构造查询用户帐号的条件
                string[] conditions = Query.GetWorkItemConditions(
                    userId,
                    true,
                    H3.WorkItem.WorkItemState.Finished,
                    H3.WorkItem.WorkItemType.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified);
                // 获取总记录数，计算页码
                recordCounts = this.Engine.PortalQuery.CountWorkItem(conditions, OThinker.H3.WorkItem.WorkItemFinished.TableName);
                return recordCounts;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 获取用户的待阅任务总数
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取用户待阅任务总数")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public int GetUserUnReadWorkItemCount(string userId)
        {
            try
            {
                ValidateSoapHeader();
                int recordCounts;
                // 构造查询用户帐号的条件
                string[] conditions = Query.GetWorkItemConditions(
                    userId,
                    true,
                    H3.WorkItem.WorkItemState.UnRead,
                    H3.WorkItem.WorkItemType.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified);

                // 获取总记录数     
                recordCounts = this.Engine.PortalQuery.CountWorkItem(conditions, OThinker.H3.WorkItem.CirculateItem.TableName);
                return recordCounts;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 获取用户的已阅任务总数
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取用户已阅任务总数")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public int GetUserReadedWorkItemCount(string userId)
        {
            try
            {
                ValidateSoapHeader();
                int recordCounts;
                // 构造查询用户帐号的条件
                //Query.get
                string[] conditions = Query.GetWorkItemConditions(
                    userId,
                    true,
                    H3.WorkItem.WorkItemState.Read,
                    H3.WorkItem.WorkItemType.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    OThinker.Data.BoolMatchValue.Unspecified);

                // 获取总记录数       
                recordCounts = this.Engine.PortalQuery.CountWorkItem(conditions, OThinker.H3.WorkItem.CirculateItemFinished.TableName);
                return recordCounts;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        // <summary>
        /// 查询用户的已办
        /// </summary>
        /// <param name="userCode">用户编码</param>
        /// <param name="startTime">开始时间（可控）</param>
        /// <param name="endTime">结束时间</param>
        /// <param name="startIndex">开始索引</param>
        /// <param name="endIndex">结束索引</param>
        /// <param name="workflowCode">流程编码</param>
        /// <param name="instanceName">流程实例名称</param>
        /// <returns></returns>
        [WebMethod(Description = "查询用户的已办")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public List<Controllers.ViewModels.WorkItemViewModel> GetFinishWorkItems(string userCode, DateTime? startTime, DateTime? endTime, int startIndex, int endIndex, string workflowCode, string instanceName)
        {
            ValidateSoapHeader();
            List<Controllers.ViewModels.WorkItemViewModel> listItems = new List<Controllers.ViewModels.WorkItemViewModel>();
            OThinker.Organization.User user = this.Engine.Organization.GetUserByCode(userCode);
            if (user == null) return listItems;

            string[] conditions = Engine.PortalQuery.GetWorkItemConditions(user.ObjectID,
                    startTime == null ? DateTime.MinValue : startTime.Value,
                    endTime == null ? DateTime.MaxValue : endTime.Value.AddDays(1),
                    WorkItem.WorkItemState.Finished,
                    instanceName,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    workflowCode,
                    true,
                    WorkItem.WorkItemFinished.TableName);
            string OrderBy = "ORDER BY " +
                 WorkItem.WorkItemFinished.TableName + "." + WorkItem.WorkItemFinished.PropertyName_ReceiveTime + " DESC";
            DataTable dtWorkitem = Engine.PortalQuery.QueryWorkItem(conditions, startIndex, endIndex, OrderBy, WorkItem.WorkItemFinished.TableName);
            //int total = Engine.PortalQuery.CountWorkItem(conditions, WorkItem.WorkItemFinished.TableName); // 记录总数
            string[] columns = new string[] { WorkItem.WorkItemFinished.PropertyName_OrgUnit };

            Controllers.WorkItemController controller = new Controllers.WorkItemController();
            List<Controllers.ViewModels.WorkItemViewModel> griddata = controller.Getgriddata(dtWorkitem, columns);

            return griddata;
        }

        // <summary>
        /// 查询用户的待办
        /// </summary>
        /// <param name="userCode">用户编码</param>
        /// <param name="startTime">开始时间（可控）</param>
        /// <param name="endTime">结束时间</param>
        /// <param name="startIndex">开始索引</param>
        /// <param name="endIndex">结束索引</param>
        /// <param name="workflowCode">流程编码</param>
        /// <param name="instanceName">流程实例名称</param>
        /// <returns></returns>
        [WebMethod(Description = "查询用户的待办")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public List<Controllers.ViewModels.WorkItemViewModel> GetUnFinishWorkItems(string userCode, DateTime? startTime, DateTime? endTime, int startIndex, int endIndex, string workflowCode, string instanceName)
        {
            ValidateSoapHeader();
            List<Controllers.ViewModels.WorkItemViewModel> listItems = new List<Controllers.ViewModels.WorkItemViewModel>();
            OThinker.Organization.User user = this.Engine.Organization.GetUserByCode(userCode);
            if (user == null) return listItems;

            string[] conditions = Engine.PortalQuery.GetWorkItemConditions(user.ObjectID,
                    startTime == null ? DateTime.MinValue : startTime.Value,
                    endTime == null ? DateTime.MaxValue : endTime.Value.AddDays(1),
                    WorkItem.WorkItemState.Unfinished,
                    instanceName,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    workflowCode,
                    true,
                    WorkItem.WorkItem.TableName);
            string OrderBy = "ORDER BY " +
                 WorkItem.WorkItem.TableName + "." + WorkItem.WorkItem.PropertyName_ReceiveTime + " DESC";
            DataTable dtWorkitem = Engine.PortalQuery.QueryWorkItem(conditions, startIndex, endIndex, OrderBy, WorkItem.WorkItem.TableName);
            //int total = Engine.PortalQuery.CountWorkItem(conditions, WorkItem.WorkItemFinished.TableName); // 记录总数
            string[] columns = new string[] { WorkItem.WorkItem.PropertyName_OrgUnit };

            Controllers.WorkItemController controller = new Controllers.WorkItemController();
            List<Controllers.ViewModels.WorkItemViewModel> griddata = controller.Getgriddata(dtWorkitem, columns);

            return griddata;
        }


        /// <summary>
        /// 查询用户的已阅任务
        /// </summary>
        /// <param name="userCode">用户编码</param>
        /// <param name="startTime">开始时间（可控）</param>
        /// <param name="endTime">结束时间</param>
        /// <param name="startIndex">开始索引</param>
        /// <param name="endIndex">结束索引</param>
        /// <param name="workflowCode">流程编码</param>
        /// <param name="instanceName">流程实例名称</param>
        /// <returns></returns>
        [WebMethod(Description = "查询用户的已阅任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public List<Controllers.ViewModels.CirculateItemViewModel> GetReadWorkItems(string userCode, DateTime? startTime, DateTime? endTime, int startIndex, int endIndex, string workflowCode, string instanceName)
        {

            ValidateSoapHeader();
            List<Controllers.ViewModels.CirculateItemViewModel> listItems = new List<Controllers.ViewModels.CirculateItemViewModel>();
            OThinker.Organization.User user = this.Engine.Organization.GetUserByCode(userCode);
            if (user == null) return listItems;
            string[] conditions = Engine.PortalQuery.GetWorkItemConditions(user.ObjectID,
                    startTime == null ? DateTime.MinValue : startTime.Value,
                    endTime == null ? DateTime.MaxValue : endTime.Value.AddDays(1),
                    WorkItem.WorkItemState.Finished,
                    instanceName,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    workflowCode,
                    false,
                    WorkItem.CirculateItemFinished.TableName);
            DataTable dtWorkitem = Engine.PortalQuery.QueryWorkItem(conditions, startIndex, endIndex, string.Empty, WorkItem.CirculateItemFinished.TableName);

            int total = Engine.PortalQuery.CountWorkItem(conditions, WorkItem.CirculateItemFinished.TableName); // 记录总数
            string[] columns = new string[] { WorkItem.CirculateItemFinished.PropertyName_OrgUnit, Query.ColumnName_OriginateUnit };

            Controllers.CirculateItemController controller = new Controllers.CirculateItemController();
            listItems = controller.Getgriddata(dtWorkitem, columns, false);
            return listItems;

        }


        /// <summary>
        /// 查询用户的待阅任务
        /// </summary>
        /// <param name="userCode">用户编码</param>
        /// <param name="startTime">开始时间（可控）</param>
        /// <param name="endTime">结束时间</param>
        /// <param name="startIndex">开始索引</param>
        /// <param name="endIndex">结束索引</param>
        /// <param name="workflowCode">流程编码</param>
        /// <param name="instanceName">流程实例名称</param>
        /// <returns></returns>
        [WebMethod(Description = "查询用户的待阅任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public List<Controllers.ViewModels.CirculateItemViewModel> GetUnReadWorkItems(string userCode, DateTime? startTime, DateTime? endTime, int startIndex, int endIndex, string workflowCode, string instanceName)
        {
            ValidateSoapHeader();
            List<Controllers.ViewModels.CirculateItemViewModel> listItems = new List<Controllers.ViewModels.CirculateItemViewModel>();
            OThinker.Organization.User user = this.Engine.Organization.GetUserByCode(userCode);
            if (user == null) return listItems;
            string[] conditions = Engine.PortalQuery.GetWorkItemConditions(user.ObjectID,
                    startTime == null ? DateTime.MinValue : startTime.Value,
                    endTime == null ? DateTime.MaxValue : endTime.Value.AddDays(1),
                    WorkItem.WorkItemState.Unfinished,
                    instanceName,
                    OThinker.Data.BoolMatchValue.Unspecified,
                    workflowCode,
                    false,
                    WorkItem.CirculateItem.TableName);
            DataTable dtWorkitem = Engine.PortalQuery.QueryWorkItem(conditions, startIndex, endIndex, string.Empty, WorkItem.CirculateItem.TableName);

            //int total = Engine.PortalQuery.CountWorkItem(conditions, WorkItem.CirculateItem.TableName); // 记录总数
            string[] columns = new string[] { WorkItem.CirculateItem.PropertyName_OrgUnit, Query.ColumnName_OriginateUnit };

            Controllers.CirculateItemController controller = new Controllers.CirculateItemController();
            listItems = controller.Getgriddata(dtWorkitem, columns, false);
            return listItems;
        }

        /// <summary>
        /// 获取待办任务信息
        /// </summary>
        /// <param name="workItemId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取待办任务信息")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public WorkItem.WorkItem GetWorkItem(string workItemId)
        {
            ValidateSoapHeader();
            WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            return item;
        }

        /// <summary>
        /// 获取业务数据的值
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="itemName"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取业务数据集合")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public object GetBizObject(string workItemId, string itemName)
        {
            ValidateSoapHeader();
            WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            Instance.InstanceContext context = this.Engine.InstanceManager.GetInstanceContext(item.InstanceId);
            OThinker.H3.DataModel.BizObjectSchema schema = this.Engine.BizObjectManager.GetPublishedSchema(item.InstanceId);
            OThinker.H3.DataModel.BizObject bo = new DataModel.BizObject(this.Engine, schema, context.Originator);
            bo.ObjectID = context.BizObjectId;
            bo.Load();
            return bo[itemName];
        }

        /// <summary>
        /// 获取传阅任务信息
        /// </summary>
        /// <param name="circulateItemId"></param>
        /// <returns></returns>
        [WebMethod(Description = "获取待办任务信息")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public WorkItem.CirculateItem GetCirculateItem(string circulateItemId)
        {
            ValidateSoapHeader();
            WorkItem.CirculateItem item = this.Engine.WorkItemManager.GetCirculateItem(circulateItemId);
            return item;
        }

        [WebMethod(Description = "获取待办任务信息")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public OThinker.H3.Instance.InstanceContext GetInstanceContext(string instanceId)
        {
            ValidateSoapHeader();
            OThinker.H3.Instance.InstanceContext context = this.Engine.InstanceManager.GetInstanceContext(instanceId);
            return context;
        }

        /// <summary>
        /// 提交(已阅)工作任务
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <returns></returns>
        [WebMethod(Description = "提交(已阅)工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool SubmitWorkItem(string workItemId, string commentText)
        {
            return this.SubmitWorkItemWithParamValues(workItemId, commentText, null);
        }

        /// <summary>
        /// 提交(已阅)工作任务
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <param name="paramValues"></param>
        /// <returns></returns>
        [WebMethod(Description = "提交(已阅)工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool SubmitWorkItemWithParamValues(string workItemId, string commentText, List<DataItemParam> paramValues)
        {
            ValidateSoapHeader();
            WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            SubmitItem(workItemId, OThinker.Data.BoolMatchValue.True, commentText, OThinker.Organization.User.AdministratorID, paramValues);//UserValidator.UserID);
            return true;
        }

        /// <summary>
        /// 驳回工作任务
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <returns></returns>
        [WebMethod(Description = "驳回工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ReturnWorkItem(string userId, string workItemId, string commentText)
        {
            return ReturnWorkItemWithParamValues(userId, workItemId, commentText, null);
        }

        /// <summary>
        /// 驳回工作任务
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <returns></returns>
        [WebMethod(Description = "驳回工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ReturnWorkItemWithParamValues(string userId, string workItemId, string commentText, List<DataItemParam> paramValues)
        {
            ValidateSoapHeader();
            // 获取操作的用户

            WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            //手工节点不允许驳回
            if (item != null && item.ItemType == WorkItem.WorkItemType.Fill) return false;
            return ReturnItem(userId, workItemId, commentText, paramValues, null);

        }


        /// <summary>
        /// 驳回工作任务到指定节点
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <returns></returns>
        [WebMethod(Description = "驳回工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ReturnWorkItemToActivity(string userId, string workItemId, string commentText, string activityCode)
        {
            return ReturnWorkItemWithParamValuesToActivity(userId, workItemId, commentText, null, activityCode);
        }

        /// <summary>
        /// 驳回工作任务到指定节点
        /// </summary>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <returns></returns>
        [WebMethod(Description = "驳回工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ReturnWorkItemWithParamValuesToActivity(string userId, string workItemId, string commentText, List<DataItemParam> paramValues, string activityCode)
        {
            ValidateSoapHeader();
            // 获取操作的用户

            WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            //手工节点不允许驳回
            if (item != null && item.ItemType == WorkItem.WorkItemType.Fill) return false;
            return ReturnItem(userId, workItemId, commentText, paramValues, activityCode);

        }

        /// <summary>
        /// 结束流程
        /// </summary>
        /// <param name="instanceId">流程实例ID</param>
        /// <returns></returns>
        [WebMethod(Description = "强制结束流程")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool FinishInstance(string instanceId)
        {
            ValidateSoapHeader();
            // 获取操作的用户

            Instance.InstanceContext context = this.Engine.InstanceManager.GetInstanceContext(instanceId);
            if (context == null) return false;

            WorkflowTemplate.PublishedWorkflowTemplate workflow = this.Engine.WorkflowManager.GetDefaultWorkflow(context.WorkflowCode);

            Messages.ActivateActivityMessage activateMessage = new Messages.ActivateActivityMessage(
                    Messages.MessageEmergencyType.High,
                    instanceId,
                    workflow.EndActivityCode,
                    OThinker.H3.Instance.Token.UnspecifiedID,
                    null,
                    null,
                    false,
                    WorkItem.ActionEventType.Adjust
                );
            this.Engine.InstanceManager.SendMessage(activateMessage);
            return true;
        }

        /// <summary>
        /// 激活流程
        /// </summary>
        /// <param name="instanceId">流程实例ID</param>
        /// <returns></returns>
        [WebMethod(Description = "激活流程")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ActiveInstance(string instanceId)
        {
            ValidateSoapHeader();
            // 获取操作的用户

            OThinker.H3.Messages.ActivateInstanceMessage activateMessage = new OThinker.H3.Messages.ActivateInstanceMessage(instanceId);
            this.Engine.InstanceManager.SendMessage(activateMessage);

            return true;
        }

        /// <summary>
        /// 激活指定的活动节点
        /// </summary>
        /// <param name="instanceId">流程实例ID</param>
        /// <param name="activityCode">活动节点</param>
        /// <param name="participants">活动参与者,可以指定参与者，如果为空那么取流程默认配置</param>
        /// <returns></returns>
        [WebMethod(Description = "激活指定的活动节点")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool ActiveToken(string instanceId, string activityCode, string[] participants)
        {
            try
            {
                ValidateSoapHeader();

                // 准备触发后面Activity的消息
                OThinker.H3.Messages.ActivateActivityMessage activateMessage
                    = new OThinker.H3.Messages.ActivateActivityMessage(
                        OThinker.H3.Messages.MessageEmergencyType.Normal,
                        instanceId,
                        activityCode,
                        OThinker.H3.Instance.Token.UnspecifiedID,
                        participants,
                        null,
                        false,
                        H3.WorkItem.ActionEventType.Adjust);
                this.Engine.InstanceManager.SendMessage(activateMessage);
                return true;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 取消指定的活动节点
        /// </summary>
        /// <param name="instanceId">流程实例ID</param>
        /// <param name="activityCode">活动节点</param>
        /// <returns></returns>
        [WebMethod(Description = "取消指定的活动节点")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool CancelToken(string instanceId, string activityCode)
        {
            try
            {
                ValidateSoapHeader();

                // 准备触发后面Activity的消息
                OThinker.H3.Messages.CancelActivityMessage cancelMessage
                    = new Messages.CancelActivityMessage(Messages.MessageEmergencyType.Normal,
                        instanceId,
                        activityCode,
                        false);
                this.Engine.InstanceManager.SendMessage(cancelMessage);
                return true;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 取回工作任务
        /// </summary>
        /// <param name="workitemId">工作任务ID</param>
        /// <returns></returns>
        [WebMethod(Description = "取回工作任务")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool RetrieveWorkItem(string userId, string workitemId)
        {
            try
            {
                ValidateSoapHeader();

                //获取工作项信息
                OThinker.H3.WorkItem.WorkItem workItem = this.Engine.WorkItemManager.GetWorkItem(workitemId);
                OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate workflow = this.Engine.WorkflowManager.GetPublishedTemplate(workItem.WorkflowCode, workItem.WorkflowVersion);
                // 检查是否能够取回
                if (workItem == null) return false;
                OThinker.H3.Instance.InstanceContext context = this.Engine.InstanceManager.GetInstanceContext(workItem.InstanceId);
                // 获得当前的Token是否存在多个分支
                OThinker.H3.Instance.IToken currentToken = context.GetToken(workItem.TokenId);
                if (currentToken == null) return false;

                int postTokenId = 0;
                string activity = "";
                if (!GetPostTokenId(context, workflow, workItem.TokenId, ref postTokenId, ref activity))
                {
                    return false;
                }

                OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader worflowTemplate = this.Engine.WorkflowManager.GetPublishedTemplateHeader(workItem.WorkflowCode, workItem.WorkflowVersion);

                // 记录操作用户ID 
                OThinker.H3.Tracking.UserLog log = new OThinker.H3.Tracking.UserLog(
                    Tracking.UserLogType.Retrieve,
                    userId,
                    "",
                    worflowTemplate.BizObjectSchemaCode,
                    workItem.InstanceId,
                    workItem.WorkItemID,
                    workItem.DisplayName,
                    null,
                    null,
                    null,
                    null);
                this.Engine.UserLogWriter.Write(log);

                // 发送取回消息
                OThinker.H3.Messages.CancelActivityMessage rollback
                        = new OThinker.H3.Messages.CancelActivityMessage(
                            OThinker.H3.Messages.MessageEmergencyType.Normal,
                            workItem.InstanceId,
                            activity,
                            true);
                this.Engine.InstanceManager.SendMessage(rollback);

                return true;
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 获取后置的路由TOKEN
        /// </summary>
        /// <param name="context">流程实例上下文</param>
        /// <param name="workflow">流程模型</param>
        /// <param name="curTokenId">当前的TokenId</param>
        /// <param name="postTokenId">下一活动的TokenId</param>
        /// <param name="activity">下以活动的ActivityCode</param>
        /// <returns>true:可以取回;false:不可取回</returns>
        private bool GetPostTokenId(OThinker.H3.Instance.InstanceContext context,
            OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate workflow,
            int curTokenId, ref int postTokenId, ref string activity)
        {

            // 获得后继的Token
            int[] postTokenIds = context.GetPostTokens(curTokenId, OThinker.H3.Instance.TokenState.Undropped);
            //判断后继任务是否可以取回
            if (postTokenIds == null || postTokenIds.Length == 0)
            {// 已经取回过了

                return false;
            }

            if (postTokenIds.Length > 1)
            {// 后继活动是发散活动
                return false;
            }
            else
            {
                postTokenId = postTokenIds[0];
                OThinker.H3.Instance.IToken postToken = context.GetToken(postTokenId);
                if (!workflow.GetActivityByCode(postToken.Activity).IsClient)
                {
                    // 具备取回的条件
                    return GetPostTokenId(context, workflow, postTokenId, ref postTokenId, ref activity);
                }
                else if (!postToken.Retrievable)
                {
                    // 无法取回
                    return false;
                }
                activity = postToken.Activity;
                return true;
            }

        }
        /// <summary>
        /// 启动H3流程实例，设置主键数据项的值(私有云接口)
        /// </summary>
        /// <param name="workflowCode"></param>
        /// <param name="userAlias"></param>
        /// <param name="finishStart"></param>
        /// <param name="keyName"></param>
        /// <param name="keyValue"></param>
        /// <returns></returns>
        [WebMethod(Description = "启动H3流程实例，设置主键数据项的值")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public BPMServiceResult StartWorkflowWithKey(
            string workflowCode,
            string userCode,
            bool finishStart,
            string keyName,
            string keyValue)
        {
            ValidateSoapHeader();
            List<DataItemParam> paramValues = new List<DataItemParam>();
            if (!string.IsNullOrEmpty(keyName))
            {
                paramValues.Add(new DataItemParam()
                {
                    ItemName = keyName,
                    ItemValue = keyValue
                });
            }

            return startWorkflow(workflowCode, userCode, finishStart, paramValues);
        }

        /// <summary>
        /// 启动H3流程实例
        /// </summary>
        /// <param name="workflowCode">流程模板编码</param>
        /// <param name="userCode">启动流程的用户编码</param>
        /// <param name="finishStart">是否结束第一个活动</param>
        /// <param name="paramValues">流程实例启动初始化数据项集合</param>
        /// <returns></returns>
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        [WebMethod(Description = "启动H3流程实例")]
        public BPMServiceResult StartWorkflow(
            string workflowCode,
            string userCode,
            bool finishStart,
            List<DataItemParam> paramValues)
        {
            try
            {
                ValidateSoapHeader();
                return startWorkflow(workflowCode, userCode, finishStart, paramValues);
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 设置单个流程数据项的值
        /// </summary>
        /// <param name="bizObjectSchemaCode"></param>
        /// <param name="bizObjectId"></param>
        /// <param name="keyName"></param>
        /// <param name="keyValue"></param>
        /// <returns></returns>
        [WebMethod(Description = "设置单个流程数据项的值")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool SetItemValue(string userId, string bizObjectSchemaCode, string bizObjectId, string keyName, object keyValue)
        {
            try
            {
                ValidateSoapHeader();
                List<DataItemParam> keyValues = new List<DataItemParam>();
                keyValues.Add(new DataItemParam()
                {
                    ItemName = keyName,
                    ItemValue = keyValue
                });
                return SetItemValues(userId, bizObjectSchemaCode, bizObjectId, keyValues);
            }
            catch (AuthenticationException ex)
            {
                throw ex;
            }
        }

        /// <summary>
        /// 设置批量流程数据项的值
        /// </summary>
        /// <param name="bizObjectSchemaCode"></param>
        /// <param name="bizObjectId"></param>
        /// <param name="keyValues"></param>
        /// <returns></returns>
        [WebMethod(Description = "设置批量流程数据项的值")]
        [System.Web.Services.Protocols.SoapHeader("authentication")]
        public bool SetItemValues(string userId, string bizObjectSchemaCode, string bizObjectId, List<DataItemParam> keyValues)
        {
            try
            {
                string userID = userId;
                ValidateSoapHeader();
                // 获取操作的用户
                if (keyValues == null || keyValues.Count == 0) return false;
                Dictionary<string, object> values = new Dictionary<string, object>();
                foreach (DataItemParam param in keyValues)
                {
                    values.Add(param.ItemName, param.ItemValue);
                }
                return this.Engine.BizObjectManager.SetPropertyValues(bizObjectSchemaCode, bizObjectId, userID, values);
            }
            catch (AuthenticationException)
            {
                throw;
            }
        }

        /// <summary>
        /// 输出日志至引擎服务器
        /// </summary>
        /// <param name="message"></param>
        [WebMethod(Description = "输出日志至引擎服务器")]
        public void WriteLog(string message)
        {
            this.Engine.LogWriter.Write(message);
        }

        #region 工作任务私有方法 ----------------
        /// <summary>
        /// 提交工作项
        /// </summary>
        /// <param name="workItemId">工作项ID</param>
        /// <param name="approval">审批结果</param>
        /// <param name="commentText">审批意见</param>
        /// <param name="userId">处理人</param>
        private void SubmitItem(string workItemId, OThinker.Data.BoolMatchValue approval, string commentText, string userId, List<DataItemParam> paramValues)
        {
            // 获取工作项
            OThinker.H3.WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            OThinker.H3.Instance.InstanceContext instance = this.Engine.InstanceManager.GetInstanceContext(item.InstanceId);
            // 添加意见
            this.AppendComment(instance, item, OThinker.Data.BoolMatchValue.True, commentText);
            // 保存表单数据
            this.SaveBizObject(userId, instance, paramValues);

            //结束工作项
            this.Engine.WorkItemManager.FinishWorkItem(
                item.ObjectID,
                userId,
                OThinker.H3.WorkItem.AccessPoint.ExternalSystem,
                null,
                approval,
                commentText,
                null,
                OThinker.H3.WorkItem.ActionEventType.Forward,
                (int)OThinker.H3.Controllers.SheetButtonType.Submit);

            // 需要通知实例事件管理器结束事件
            Messages.AsyncEndMessage endMessage = new OThinker.H3.Messages.AsyncEndMessage(
                    Messages.MessageEmergencyType.Normal,
                    item.InstanceId,
                    item.ActivityCode,
                    item.TokenId,
                    approval,
                    false,
                    approval,
                    true,
                    null);
            this.Engine.InstanceManager.SendMessage(endMessage);
        }

        /// <summary>
        /// 保存表单数据
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="context"></param>
        /// <param name="paramValues"></param>
        private void SaveBizObject(string userId, Instance.InstanceContext context, List<DataItemParam> paramValues)
        {
            // 保存表单数据
            if (paramValues != null && paramValues.Count > 0)
            {
                OThinker.H3.DataModel.BizObjectSchema schema = this.Engine.BizObjectManager.GetPublishedSchema(context.BizObjectSchemaCode);
                OThinker.H3.DataModel.BizObject bo = new DataModel.BizObject(this.Engine, schema, userId);
                bo.ObjectID = context.ObjectID;

                // 这里可以在创建流程的时候赋值
                foreach (DataItemParam param in paramValues)
                {
                    this.SetDataItemValue(bo, param);
                }
                bo.Update();
            }
        }

        /// <summary>
        /// 设置数据项的值
        /// </summary>
        /// <param name="bo"></param>
        /// <param name="param"></param>
        private void SetDataItemValue(OThinker.H3.DataModel.BizObject bo, DataItemParam param)
        {
            if (bo.Schema.ContainsField(param.ItemName))
            {
                OThinker.H3.DataModel.PropertySchema property = bo.Schema.GetProperty(param.ItemName);
                if (property.LogicType == Data.DataLogicType.ShortString
                    || property.LogicType == Data.DataLogicType.String
                    || property.LogicType == Data.DataLogicType.DateTime
                    || property.LogicType == Data.DataLogicType.Decimal
                    || property.LogicType == Data.DataLogicType.Double
                    || property.LogicType == Data.DataLogicType.Int
                    || property.LogicType == Data.DataLogicType.Html
                    || property.LogicType == Data.DataLogicType.Long)
                {
                    bo[param.ItemName] = param.ItemValue;
                }
                else if (property.LogicType == Data.DataLogicType.SingleParticipant)
                {
                    string userId = param.ItemValue + string.Empty;
                    if (userId.Length == 36) { bo[param.ItemName] = userId; }
                    else
                    {
                        Organization.User user = this.Engine.Organization.GetUserByCode(userId);
                        if (user != null) bo[param.ItemName] = user.ObjectID;
                    }
                }
                else if (property.LogicType == Data.DataLogicType.MultiParticipant)
                {
                    try
                    {
                        string[] userIds = param.ItemValue as string[];
                        if (userIds != null)
                        {
                            List<string> uesrValues = new List<string>();
                            foreach (string userId in userIds)
                            {
                                if (userId.Length == 36) { uesrValues.Add(userId); }
                                else
                                {
                                    Organization.User user = this.Engine.Organization.GetUserByCode(userId);
                                    if (user != null) uesrValues.Add(user.ObjectID);
                                }
                            }
                            bo[param.ItemName] = userIds.ToArray();
                        }
                    }
                    catch (Exception ex) { this.Engine.LogWriter.Write("SetItemValue->" + ex.ToString()); }
                }
            }
        }

        /// <summary>
        /// 驳回工作任务
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="workItemId"></param>
        /// <param name="commentText"></param>
        /// <param name="paramValues"></param>
        /// <returns></returns>
        private bool ReturnItem(string userId, string workItemId, string commentText, List<DataItemParam> paramValues, string activityCode)
        {
            Organization.User user = this.Engine.Organization.GetUnit(userId) as Organization.User;
            if (user == null) return false;
            // 获取工作项
            OThinker.H3.WorkItem.WorkItem item = this.Engine.WorkItemManager.GetWorkItem(workItemId);
            OThinker.H3.Instance.InstanceContext context = this.Engine.InstanceManager.GetInstanceContext(item.InstanceId);
            OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate workflow = this.Engine.WorkflowManager.GetPublishedTemplate(item.WorkflowCode, item.WorkflowVersion);

            string activityName = activityCode;
            if (string.IsNullOrEmpty(activityName))
            {
                // 获取上一个提交过来的活动节点
                H3.Instance.IToken preToken = this.GetPreToken(item.TokenId, item, context, workflow);
                //判断上一个节点是否是连接点节点,是连接点则继续向前寻找
                if (preToken == null) return false;
                activityName = preToken.Activity;

            }
            // 添加意见
            this.AppendComment(context, item, OThinker.Data.BoolMatchValue.False, commentText);
            // 保存表单数据
            this.SaveBizObject(userId, context, paramValues);

            // 结束工作项
            this.Engine.WorkItemManager.FinishWorkItem(
                  item.ObjectID,
                  user.ObjectID,
                  H3.WorkItem.AccessPoint.ExternalSystem,

                  null,
                  OThinker.Data.BoolMatchValue.False,
                  commentText,
                  null,
                  H3.WorkItem.ActionEventType.Backward,
                  (int)OThinker.H3.Controllers.SheetButtonType.Return);
            // 准备触发后面Activity的消息
            OThinker.H3.Messages.ActivateActivityMessage activateMessage
                = new OThinker.H3.Messages.ActivateActivityMessage(
                OThinker.H3.Messages.MessageEmergencyType.Normal,
                item.InstanceId,
                activityName,
                OThinker.H3.Instance.Token.UnspecifiedID,
                null,
                new int[] { item.TokenId },
                false,
                H3.WorkItem.ActionEventType.Backward);

            // 通知该Activity已经完成
            OThinker.H3.Messages.AsyncEndMessage endMessage =
                new OThinker.H3.Messages.AsyncEndMessage(
                    OThinker.H3.Messages.MessageEmergencyType.Normal,
                    item.InstanceId,
                    item.ActivityCode,
                    item.TokenId,
                    OThinker.Data.BoolMatchValue.False,
                    true,
                    OThinker.Data.BoolMatchValue.False,
                    false,
                    activateMessage);
            this.Engine.InstanceManager.SendMessage(endMessage);
            return true;
        }

        #region 获取前一个活动
        /// <summary>
        /// 获取前一个活动
        /// </summary>
        /// <param name="TokenId"></param>
        /// <returns></returns>
        private OThinker.H3.Instance.IToken GetPreToken(int TokenId, OThinker.H3.WorkItem.WorkItem item, OThinker.H3.Instance.InstanceContext context, OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate workflow)
        {
            // 通过日志获得当前步骤令牌
            H3.Instance.IToken token = context.GetToken(TokenId);
            H3.Instance.IToken preToken = GetPreToken(token, item, context, workflow);
            if (preToken != null)
            {
                Activity preActivity = workflow.GetActivityByCode(preToken.Activity);
                if (preActivity.ActivityType == ActivityType.FillSheet
                    || preActivity.ActivityType == ActivityType.Approve
                    || preActivity.ActivityType == ActivityType.SubInstance)
                {
                    return preToken;
                }
                else
                {
                    return GetPreToken(preToken.TokenId, item, context, workflow);
                }
            }

            // 继续检测该活动的历史活动，直到找到最近的一次提交源为止
            H3.Instance.IToken[] historyTokens = context.GetTokens(item.ActivityCode, H3.Instance.TokenState.Finished);
            if (historyTokens != null)
            {
                foreach (H3.Instance.IToken historyToken in historyTokens)
                {
                    preToken = this.GetPreToken(historyToken, item, context, workflow);
                    if (preToken != null) return preToken;
                }
            }
            return null;
        }

        /// <summary>
        /// 获取某个活动的前驱活动
        /// </summary>
        /// <param name="Token"></param>
        /// <returns></returns>
        private OThinker.H3.Instance.IToken GetPreToken(H3.Instance.IToken Token, OThinker.H3.WorkItem.WorkItem item, OThinker.H3.Instance.InstanceContext context, OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplate workflow)
        {
            if (Token == null || Token.PreTokens == null || Token.PreTokens.Length != 1) return null;
            int preTokenId = Token.PreTokens[0];
            H3.Instance.IToken preToken = context.GetToken(preTokenId);
            if (preToken.Activity == item.ActivityCode)
            {// 前一个活动的节点就是本节点，禁止打回
                return null;
            }
            //前一个活动是连接点的话,需要继续向前寻找活动
            Activity preActivity = workflow.GetActivityByCode(preToken.Activity);
            if (preActivity.ActivityType == ActivityType.Connection)
            {
                return GetPreToken(preToken, item, context, workflow);
            }
            if (preToken.Approval != OThinker.Data.BoolMatchValue.False)
            {// 前一个活动是提交，则返回当前活动
                return preToken;
            }
            return null;
        }
        #endregion
        private BPMServiceResult startWorkflow(
            string workflowCode,
            string userCode,
            bool finishStart,
            List<DataItemParam> paramValues)
        {
            ValidateSoapHeader();
            string workItemID, keyItem, errorMessage;
            workItemID = keyItem = errorMessage = string.Empty;
            BPMServiceResult result;

            try
            {
                // 获取模板
                OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader workflowTemplate = GetWorkflowTemplate(workflowCode);
                if (workflowTemplate == null)
                {
                    result = new BPMServiceResult(false, "流程启动失败,流程模板不存在，模板编码:" + workflowCode + "。");
                    return result;
                }
                // 查找流程发起人
                OThinker.Organization.User user = this.Engine.Organization.GetUserByCode(userCode) as Organization.User;
                if (user == null)
                {
                    result = new BPMServiceResult(false, "流程启动失败,用户{" + userCode + "}不存在。");
                    return result;
                }

                OThinker.H3.DataModel.BizObjectSchema schema = this.Engine.BizObjectManager.GetPublishedSchema(workflowTemplate.BizObjectSchemaCode);
                OThinker.H3.DataModel.BizObject bo = new DataModel.BizObject(
                    this.Engine.Organization,
                    this.Engine.MetadataRepository,
                    this.Engine.BizObjectManager,
                    this.Engine.BizBus,
                    schema,
                    OThinker.Organization.User.AdministratorID,
                    OThinker.Organization.OrganizationUnit.DefaultRootID);

                if (paramValues != null)
                {
                    // 这里可以在创建流程的时候赋值
                    foreach (DataItemParam param in paramValues)
                    {
                        this.SetDataItemValue(bo, param);
                    }
                }

                bo.Create();

                // 创建流程实例
                string InstanceId = this.Engine.InstanceManager.CreateInstance(
                     bo.ObjectID,
                     workflowTemplate.WorkflowCode,
                     workflowTemplate.WorkflowVersion,
                     null,
                     null,
                     user.UnitID,
                     null,
                     false,
                     Instance.InstanceContext.UnspecifiedID,
                     null,
                     Instance.Token.UnspecifiedID);

                // 设置紧急程度为普通
                OThinker.H3.Messages.MessageEmergencyType emergency = Messages.MessageEmergencyType.Normal;
                // 这里也可以在启动流程的时候赋值
                Dictionary<string, object> paramTables = new Dictionary<string, object>();

                // 启动流程的消息
                OThinker.H3.Messages.StartInstanceMessage startInstanceMessage
                    = new OThinker.H3.Messages.StartInstanceMessage(
                        emergency,
                        InstanceId,
                        null,
                        paramTables,
                        Instance.PriorityType.Normal,
                        true,
                        null,
                        false,
                        OThinker.H3.Instance.Token.UnspecifiedID,
                        null);
                Engine.InstanceManager.SendMessage(startInstanceMessage);
                result = new BPMServiceResult(true, InstanceId, workItemID, "流程实例启动成功！", "");
            }
            catch (Exception ex)
            {
                result = new BPMServiceResult(false, "流程实例启动失败！错误：" + ex.ToString());
            }
            return result;
        }

        /// <summary>
        /// 给工作项添加审批意见
        /// </summary>
        /// <param name="item">工作项</param>
        /// <param name="approval">审批结果</param>
        /// <param name="commentText">审批意见</param>
        private void AppendComment(OThinker.H3.Instance.InstanceContext Instance, OThinker.H3.WorkItem.WorkItem item, OThinker.Data.BoolMatchValue approval, string commentText)
        {
            // 添加一个审批意见
            WorkflowTemplate.PublishedWorkflowTemplate workflow = this.Engine.WorkflowManager.GetPublishedTemplate(
                item.WorkflowCode,
                item.WorkflowVersion);
            // 审批字段
            string approvalDataItem = null;
            if (workflow != null)
            {
                OThinker.H3.DataModel.BizObjectSchema schema = this.Engine.BizObjectManager.GetPublishedSchema(item.WorkflowCode);
                approvalDataItem = workflow.GetDefaultCommentDataItem(schema, item.ActivityCode);
            }
            if (approvalDataItem != null)
            {
                // 创建审批
                OThinker.H3.Data.Comment comment = new Data.Comment();
                comment.Activity = item.ActivityCode;
                comment.Approval = approval;
                comment.CreatedTime = System.DateTime.Now;
                comment.DataField = approvalDataItem;
                comment.InstanceId = item.InstanceId;
                comment.BizObjectId = Instance.BizObjectId;
                comment.BizObjectSchemaCode = Instance.BizObjectSchemaCode;
                comment.OUName = this.Engine.Organization.GetName(this.Engine.Organization.GetParent(item.Participant));
                comment.Text = commentText;
                comment.TokenId = item.TokenId;
                comment.UserID = item.Participant;
                comment.UserName = this.Engine.Organization.GetName(item.Participant);


                // 设置用户的默认签章
                Organization.Signature[] signs = this.Engine.Organization.GetSignaturesByUnit(item.Participant);
                if (signs != null && signs.Length > 0)
                {
                    foreach (Organization.Signature sign in signs)
                    {
                        if (sign.IsDefault)
                        {
                            comment.SignatureId = sign.ObjectID;
                            break;
                        }
                    }
                }
                this.Engine.BizObjectManager.AddComment(comment);
            }
        }
        #endregion

        /// <summary>
        /// 获取最新的流程模板
        /// </summary>
        /// <param name="workflowCode">流程模板编码</param>
        /// <returns></returns>
        private OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader GetWorkflowTemplate(string workflowCode)
        {
            // 获取最新版本号
            int workflowVersion = this.Engine.WorkflowManager.GetWorkflowDefaultVersion(workflowCode);
            return GetWorkflowTemplate(workflowCode, workflowVersion);
        }

        /// <summary>
        /// 获取指定版本号的流程模板对象
        /// </summary>
        /// <param name="workflowCode">流程模板编码</param>
        /// <param name="workflowVersion">流程模板版本号</param>
        /// <returns></returns>
        private OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader GetWorkflowTemplate(string workflowCode, int workflowVersion)
        {
            // 获取模板
            OThinker.H3.WorkflowTemplate.PublishedWorkflowTemplateHeader workflowTemplate = this.Engine.WorkflowManager.GetPublishedTemplateHeader(
                    workflowCode,
                    workflowVersion);
            return workflowTemplate;
        }

        public Authentication authentication;
        // public OThinker.H3.Controllers.UserValidator UserValidator = null;

        /// <summary>
        /// 验证当前用户是否正确
        /// </summary>
        /// <returns></returns>
        public void ValidateSoapHeader()
        {
            if (authentication == null)
            {
                throw new AuthenticationException("请输入身份认证信息!", null);
            }
            bool result = this.Engine.SSOManager.ValidateSSOSystem(authentication.SystemCode, authentication.Secret);
            if (!result)
            {
                throw new AuthenticationException("帐号或密码不正确!", null);
            }
            // this.Engine = UserValidator.Engine;
            // this.Engine = OThinker.H3.WorkSheet.AppUtility.Engine;
        }
    }


    public class Employee
    {
        public Employee() { }
        public Employee(string UserCode, string Password)
        {
            this.UserCode = UserCode;
            this.Password = Password;
        }

        public string UserCode { get; set; }
        public string Password { get; set; }
    }

    /// <summary>
    /// 身份验证类
    /// </summary>
    public class Authentication : System.Web.Services.Protocols.SoapHeader
    {
        public Authentication() { }

        /// <summary>
        /// SOAPHeader，验证
        /// </summary>
        /// <param name="SystemCode"></param>
        /// <param name="Secret"></param>
        public Authentication(string SystemCode, string Secret)
        {
            this.SystemCode = SystemCode;
            this.Secret = Secret;
        }

        public string SystemCode { get; set; }
        public string Secret { get; set; }
    }

    /// <summary>
    /// 流程服务返回消息类
    /// </summary>
    public class BPMServiceResult
    {
        /// <summary>
        /// 消息类构造函数
        /// </summary>
        /// <param name="success"></param>
        /// <param name="instanceId"></param>
        /// <param name="workItemId"></param>
        /// <param name="message"></param>
        public BPMServiceResult(bool success, string instanceId, string workItemId, string message, string WorkItemUrl)
        {
            this.Success = success;
            this.InstanceID = instanceId;
            this.Message = message;
            this.WorkItemID = workItemId;
            this.WorkItemUrl = WorkItemUrl;
        }

        /// <summary>
        /// 消息类构造函数
        /// </summary>
        /// <param name="success"></param>
        /// <param name="message"></param>
        public BPMServiceResult(bool success, string message)
            : this(success, string.Empty, string.Empty, message, string.Empty)
        {

        }

        public BPMServiceResult() { }

        private bool success = false;
        /// <summary>
        /// 获取或设置流程启动是否成功
        /// </summary>
        public bool Success
        {
            get { return success; }
            set { success = value; }
        }
        private string instanceId = string.Empty;
        /// <summary>
        /// 获取或设置启动的流程实例ID
        /// </summary>
        public string InstanceID
        {
            get { return instanceId; }
            set { this.instanceId = value; }
        }
        private string message = string.Empty;
        /// <summary>
        /// 获取或设置系统返回消息
        /// </summary>
        public string Message
        {
            get { return message; }
            set { this.message = value; }
        }
        private string workItemId = string.Empty;
        /// <summary>
        /// 获取或设置第一个节点的ItemID
        /// </summary>
        public string WorkItemID
        {
            get { return workItemId; }
            set { this.workItemId = value; }
        }
        private string workItemUrl = string.Empty;
        /// <summary>
        /// 获取或设置第一个节点的url
        /// </summary>
        public string WorkItemUrl
        {
            get { return workItemUrl; }
            set { this.workItemUrl = value; }
        }
    }

    /// <summary>
    /// 提交任务后返回对象
    /// </summary>
    [Serializable]
    public class ReturnWorkItemInfo
    {
        public ReturnWorkItemInfo() { }
        private bool isSuccess = false;
        /// <summary>
        /// 是否提交成功
        /// </summary>
        public bool IsSuccess
        {
            get { return isSuccess; }
            set { this.isSuccess = value; }
        }
        private string workItemUrl = string.Empty;
        /// <summary>
        /// 当前表单地址
        /// </summary>
        public string WorkItemUrl
        {
            get { return workItemUrl; }
            set { this.workItemUrl = value; }
        }
    }

    /// <summary>
    /// 数据项参数
    /// </summary>
    [Serializable]
    public class DataItemParam
    {
        private string itemName = string.Empty;
        /// <summary>
        /// 获取或设置数据项名称
        /// </summary>
        public string ItemName
        {
            get { return itemName; }
            set { this.itemName = value; }
        }

        private object itemValue = string.Empty;
        /// <summary>
        /// 获取或设置数据项的值
        /// </summary>
        public object ItemValue
        {
            get { return itemValue; }
            set { this.itemValue = value; }
        }
    }
    [Serializable]
    public class AuthenticationException : ApplicationException
    {
        public AuthenticationException()
        { }

        public AuthenticationException(string message)
            : base(message)
        {
        }
        public AuthenticationException(string message, Exception inner)
            : base(message, inner)
        { }
    }

}