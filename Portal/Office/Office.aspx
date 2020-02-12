<%@ Page Language="C#" AutoEventWireup="true" CodeFile="Office.aspx.cs" Inherits="Office_Office" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>控件下载</title>
</head>
<script language="javascript" type="text/javascript">
    function AddMyMenuItems() {
        try {
            //在自定义主菜单中增加菜单项目
            TANGER_OCX_OBJ.AddCustomMenuItem("手写签名", false, false, 1);
            TANGER_OCX_OBJ.AddCustomMenuItem("模板套用");
            TANGER_OCX_OBJ.AddCustomMenuItem("盖章", false, false, 2);
            TANGER_OCX_OBJ.AddCustomMenuItem("保存PDF");
            //在文件菜单中增加菜单项目
            /*
            TANGER_OCX_OBJ.AddFileMenuItem('创建Word文档', false, false, 1);
            TANGER_OCX_OBJ.AddFileMenuItem('创建Excel文档', false, false, 2);
            TANGER_OCX_OBJ.AddFileMenuItem('创建PPT文档', false, false, 3);
            TANGER_OCX_OBJ.AddFileMenuItem('关闭文档', false, true, 4);
            TANGER_OCX_OBJ.AddFileMenuItem('');
            */
            // 设置菜单不可见
            TANGER_OCX_OBJ.Titlebar = false;

            // 禁止文件中的菜单
            TANGER_OCX_OBJ.FileNew = false;           // 新建文档
            TANGER_OCX_OBJ.FileOpen = false;          // 打开文档
            TANGER_OCX_OBJ.FileClose = false;         // 关闭文档
            TANGER_OCX_OBJ.FileSave = false;          // 文档保存
            TANGER_OCX_OBJ.FileSaveAs = false;        // 文件另存为
            TANGER_OCX_OBJ.FilePrint = true;          // 文件打印
            TANGER_OCX_OBJ.FilePrintPreview = true;   // 打印预览

            // 去除滚动条
            TANGER_OCX_OBJ.ActiveDocument.Application.ActiveWindow.ActivePane.View.Zoom.Percentage = 100;
        }
        catch (err) {
            alert("不能创建新对象：" + err.number + ":" + err.description);
        }
        finally {
        }
    }

    // window.onload = AddMyMenuItems;
</script>
<body>
    <form id="form1" runat="server">
    <table border="0" style="text-align: center; width: 80%">
        <tr>
            <td style="height: 900px;">
                <object id="TANGER_OCX" classid="clsid:A39F1330-3322-4a1d-9BF0-0BA2BB90E970" codebase="officecontrol.cab#version=5,0,1,6"
                    width="900px" height="826px">
                    <param name="productkey" value="422A6ECE92EB12A0E87319303E6160A06B3C897E">   
                    <param name="productcaption" value="中海地产">
                    <param name="BorderStyle" value="1" />
                    <param name="BorderColor" value="14402205">
                    <param name="TitlebarColor" value="14402205">
                    <param name="TitlebarTextColor" value="0">
                    <param name="MenubarColor" value="14402205">
                    <param name="MenuButtonColor" value="16180947">
                    <param name="MenuBarStyle" value="3">
                    <param name="MenuButtonStyle" value="7">
                    <param name="Caption" value="">
                    <param name="IsShowToolMenu" value="-1">
                    <param name="IsNoCopy" value="-1">
                    <param name="CustomMenuCaption" value="编辑">
                    <span style="color: red">不能装载文档控件。请在检查浏览器的选项中检查浏览器的安全设置。</span>
                </object>
            </td>
        </tr>
    </table>
    </form>
    <!-- 以下函数相应控件的两个事件:OnDocumentClosed,和OnDocumentOpened -->
    <script language="JScript" for="TANGER_OCX" event="OnDocumentClosed()">
            TANGER_OCX_bDocOpen = false; //设置全局变量状态
    </script>
    <script language="JScript" for="TANGER_OCX" event="OnDocumentOpened(TANGER_OCX_str,TANGER_OCX_obj)">
            TANGER_OCX_bDocOpen = true;
    </script>
    <script language="javascript">
        // 首次创建时打开模板文档
        var TANGER_OCX_OBJ = null; //标识控件对象
        TANGER_OCX_OBJ = document.getElementById("TANGER_OCX");
        TANGER_OCX_OBJ.openFromUrl("Template.doc");
        TANGER_OCX_OBJ.ActiveDocument.Application.ActiveWindow.ActivePane.View.Zoom.Percentage = 90;
    </script>
</body>
</html>
