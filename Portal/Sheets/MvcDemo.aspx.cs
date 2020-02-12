using OThinker.H3.Controllers;
using OThinker.H3.DataModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace OThinker.H3.Portal.Sheets
{/// <summary>
    /// MVC自定义表单DEMO，展示
    /// </summary>
    public partial class MvcDemo : OThinker.H3.Controllers.MvcPage
    {
        /// <summary>
        /// 页面加载事件
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void Page_Load(object sender, EventArgs e)
        {
            //this.ActionContext.ActivityCode;    // 当前活动节点
            //this.ActionContext.BizObject;       // 当前数据模型对象
            //this.ActionContext.Engine;          // 引擎接口
            //this.ActionContext.IsOriginateMode; // 是否发起模式
            //this.ActionContext.IsWorkMode;      // 是否工作模式
            //this.ActionContext.SchemaCode;      // 当前数据模型编码
            //this.ActionContext.User;            // 当前用户对象

        }

        /// <summary>
        /// 自定义按钮调用的后台方法
        /// </summary>
        /// <param name="userID"></param>
        /// <returns></returns>
        public Product TestAction(string userID)
        {
            // 该方法的返回结果会序列化为JSON格式输出到前端
            string name = this.ActionContext.Engine.Organization.GetName(userID);
            Product p = new Product()
            {
                Name = "Name->" + name + DateTime.Now.ToString("ss"),
                Code = "Code->" + userID
            };
            return p;
        }

        /// <summary>
        /// 加载表单数据
        /// </summary>
        /// <returns></returns>
        public override MvcViewContext LoadDataFields()
        {
            // 注意：这只是赋值，会显示到前端，但是如果前端的值不做变化，是不会存储到后台的
            this.ActionContext.InstanceData["mvcMobile"].Value = "系统赋值";
            /*
             * 子表设置初始化值，注：子表默认会有一行空数据，并且未填数据时，不会保存
             */
            if (this.ActionContext.IsOriginateMode)
            {
                BizObject[] bizObjects = new BizObject[2];
                BizObjectSchema childSchema = this.ActionContext.Schema.GetProperty("mvcDetail").ChildSchema;
                // 第一行
                bizObjects[0] = new BizObject(this.ActionContext.Engine, childSchema, this.ActionContext.User.UserID);
                bizObjects[0]["code"] = "aa";
                // 第二行
                bizObjects[1] = new BizObject(this.ActionContext.Engine, childSchema, this.ActionContext.User.UserID);
                bizObjects[1]["code"] = "bb";
                this.ActionContext.InstanceData["mvcDetail"].Value = bizObjects;
            }
            MvcViewContext context = base.LoadDataFields();
            // 设置数据项必填
            // context.BizObject.DataItems["数据项编码"].O += "R";
            return context;
        }

        /// <summary>
        /// 保存表单数据到引擎中
        /// </summary>
        /// <param name="Args"></param>
        public override void SaveDataFields(MvcPostValue MvcPost, MvcResult result)
        {
            // 以下函数可改变数据项的值
            MvcPost.BizObject.DataItems.SetValue("mvcName", "Save值");
            // 保存后，后台执行事件
            base.SaveDataFields(MvcPost, result);
        }

        /// <summary>
        /// ASP.NET按钮触发事件，不建议这么直接调用
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void txtButton_Click(object sender, EventArgs e)
        {
            // 如果需要执行后台方法，则需要去除缓存，注释前端的：OutputCache
            this.txtButton.Text = DateTime.Now.ToString("mmss");
        }

        /// <summary>
        /// 重写权限验证
        /// </summary>
        /// <returns></returns>
        public override OThinker.Data.BoolMatchValue ValidateAuthorization()
        {
            return base.ValidateAuthorization();
        }

        /// <summary>
        /// 如果要征询意见/协办/传阅，那么可选的征询意见/协办/传阅的人员由这里获得
        /// </summary>
        /// <returns></returns>
        public override Dictionary<string, UserOptions> GetOptionalRecipients()
        {
            Dictionary<string, UserOptions> OptionalRecipients = new Dictionary<string, UserOptions>();
            OptionalRecipients.Add(
                OThinker.H3.Controllers.SelectRecipientType.Circulate.ToString(),  // 传阅选人范围控制
                new UserOptions()
                {
                    GroupVisible = false,
                    PlaceHolder = "传阅人",
                    UserVisible = true,
                    OrgUnitVisible = false,
                    // 该属性控制可选择人员的范围
                    VisibleUnits = this.ActionContext.Engine.Organization.GetUnit(this.ActionContext.User.User.ParentID).ObjectID
                });
            OptionalRecipients.Add(
               OThinker.H3.Controllers.SelectRecipientType.Assist.ToString(),     // 协办选人范围控制
               new UserOptions()
               {
                   GroupVisible = false,
                   PlaceHolder = "协办人",
                   UserVisible = true,
                   OrgUnitVisible = false,
                   VisibleUnits = this.ActionContext.Engine.Organization.GetUnit(this.ActionContext.User.User.ParentID).ObjectID
               });
            // 可继续添加转发、征询操作的选人范围控制
            return OptionalRecipients;
        }
    }

    /// <summary>
    /// 自定义输出到前端的结构
    /// </summary>
    public class Product
    {
        public string Code { get; set; }
        public string Name { get; set; }
    }
}