using OThinker.Clusterware;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace OThinker.H3.Portal.admin
{
    public partial class ThreadAdmin : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                this.BindGridView();
            }
        }

        private void BindGridView()
        {
            ThreadMessageCollection threadTable = Application["ThreadMessageCollection"] as ThreadMessageCollection;
            List<ThreadMessage> datas = null;
            if (threadTable != null) datas = threadTable.ToList();
            if (datas == null) datas = new List<ThreadMessage>();

            this.gvThreads.DataSource = datas;
            this.gvThreads.DataBind();
        }

        protected void gvThreads_RowDataBound(object sender, GridViewRowEventArgs e)
        {

        }

        protected void btnAbort_Click(object sender, EventArgs e)
        {
            int threadId = 0;
            int.TryParse(((System.Web.UI.WebControls.LinkButton)(sender)).CommandArgument, out threadId);

            ThreadMessageCollection threadTable = Application["ThreadMessageCollection"] as ThreadMessageCollection;
            if (threadTable != null)
            {
                try
                {
                    threadTable.AbortThread(threadId);
                    this.lblMessage.Text = string.Format("进程{0}已结束", threadId);
                }
                catch (Exception ex)
                {
                    this.lblMessage.Text = ex.ToString();
                }
            }

            BindGridView();
        }

        /// <summary>
        /// 刷新
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void btnRefresh_Click(object sender, EventArgs e)
        {
            BindGridView();
        }


    }
}