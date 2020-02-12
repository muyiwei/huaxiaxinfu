<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="ThreadAdmin.aspx.cs" Inherits="OThinker.H3.Portal.admin.ThreadAdmin" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title></title>
    <style type="text/css">
        body {
            font-size: 12px;
        }

        table {
            padding: 20px;
        }

            table td {
                padding: 5px;
                min-height: 28px;
            }
    </style>
</head>
<body>
    <form id="form1" runat="server">
        <div>
            <div style="padding-bottom: 15px;">
                <asp:Button ID="btnRefresh" runat="server" Text="刷新" OnClick="btnRefresh_Click" />
            </div>
            <asp:GridView ID="gvThreads" runat="server" AutoGenerateColumns="false" Width="100%" OnRowDataBound="gvThreads_RowDataBound">
                <Columns>
                    <asp:ButtonField HeaderText="线程ID" DataTextField="ThreadId" HeaderStyle-Width="50px" />
                    <asp:ButtonField HeaderText="开始时间" DataTextField="StartTime" HeaderStyle-Width="150px" />
                    <asp:ButtonField HeaderText="耗时" DataTextField="UsedTime" HeaderStyle-Width="100px" />
                    <asp:ButtonField HeaderText="URL" DataTextField="ModuleName" HeaderStyle-Width="35%" />
                    <asp:ButtonField HeaderText="客户端" DataTextField="MethodName" />
                    <asp:TemplateField HeaderText="操作" HeaderStyle-Width="60px">
                        <ItemTemplate>
                            <asp:LinkButton Text="强制结束" ID="btnAbort" runat="server" CommandName="Abort" CommandArgument='<%# DataBinder.Eval(Container.DataItem, "ThreadId") %>' OnClick="btnAbort_Click"></asp:LinkButton>
                        </ItemTemplate>
                    </asp:TemplateField>
                </Columns>
            </asp:GridView>
            <div style="padding-top: 15px;">
                <asp:Label ID="lblMessage" runat="server" ForeColor="Red"></asp:Label>
            </div>
        </div>
    </form>
</body>
</html>
