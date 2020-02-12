using OThinker.H3.Controllers;
//using OThinker.H3.WorkSheet;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace OThinker.H3.Portal
{
    public partial class MvcSheet : System.Web.UI.MasterPage
    {
        /// <summary>
        /// 页面加载方法
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void Page_Load(object sender, EventArgs e)
        {
            lblTitle.Text = ((MvcPage)sheetContent.Page).ActionContext.SheetDisplayName;
        }

        /// <summary>
        /// 获取站点根目录路径
        /// </summary>
        public string PortalRoot
        {
            get
            {
                return AppConfig.PortalRoot.Length <= 1 ? string.Empty : AppConfig.PortalRoot;
            }
        }

        /// <summary>
        /// 获取是否通过手机访问
        /// </summary>
        public bool IsMobile
        {
            get
            {
                return SheetUtility.IsMobile;
            }
        }
    }
}