<%@ WebService Language="C#" Class="Organization" %>

using System;
using System.Web;
using System.Collections;
using System.Web.Services;
using System.Web.Services.Protocols;

/// <summary>
/// Summary description for Organization
/// </summary>
[WebService(Namespace = "http://tempuri.org/")]
[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
public class Organization : System.Web.Services.WebService
{
    public Organization()
    {

        //Uncomment the following line if using designed components 
        //InitializeComponent(); 
    }


    [WebMethod]
    public string GetManager(string ID)
    {
        return OThinker.H3.Controllers.AppUtility.Engine.Organization.GetManager(ID);
    }

    [WebMethod]
    public string GetName(string UserID)
    {
        return OThinker.H3.Controllers.AppUtility.Engine.Organization.GetName(UserID);
    }

    [WebMethod]
    public string GetFullName(string UnitID)
    {
        return OThinker.H3.Controllers.AppUtility.Engine.Organization.GetFullName(UnitID);
    }

    [WebMethod]
    public string GetParent(string ID)
    {
        return OThinker.H3.Controllers.AppUtility.Engine.Organization.GetParent(ID);
    }



    [WebMethod]
    public bool IsAncestor(string ChildID, string AncestorID)
    {
        return OThinker.H3.Controllers.AppUtility.Engine.Organization.IsAncestor(ChildID, AncestorID);
    }

    [WebMethod]
    public OThinker.Organization.HandleResult AddUser(string Modifier, OThinker.Organization.User User)
    {
        return OThinker.H3.Controllers.AppUtility.Engine.Organization.AddUnit(Modifier, User);
    }

    [WebMethod]
    public OThinker.Organization.HandleResult AddGroup(string Modifier, OThinker.Organization.Group Group)
    {
        return OThinker.H3.Controllers.AppUtility.Engine.Organization.AddUnit(Modifier, Group);
    }

    [WebMethod]
    public OThinker.Organization.HandleResult AddOrgUnit(string Modifier, OThinker.Organization.OrganizationUnit OrgUnit)
    {
        return OThinker.H3.Controllers.AppUtility.Engine.Organization.AddUnit(Modifier, OrgUnit);
    }
}

