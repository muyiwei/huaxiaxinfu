app.service('webpartSave', ['$http', 'ControllerConfig', function ($http, ControllerConfig) {

    this.save = function (PageId, WebPartObjectID, WebPartID, WebPartPost, scope) {
        console.log(scope.MorePos)
        if (scope.MorePos == undefined) {
            scope.MorePos = "br";
        }
        if (scope.PartType == "Ascx") {
            var PublicValue = this.GetPublicValue(scope);
            var PrivateValue = this.GetHtmlPrivateValue(scope);
            this.PostHttp(PageId, WebPartObjectID, WebPartID, WebPartPost, PublicValue, PrivateValue);
        } else if (scope.PartType == "DataModel") {
            var PublicValue = this.GetPublicValue(scope);
            var PrivateValue = this.GetDataModelPrivateValue(scope);
            this.PostHttp(PageId, WebPartObjectID, WebPartID, WebPartPost, PublicValue, PrivateValue);
        } else if (scope.PartType == "Static") {
            var PublicValue = this.GetPublicValue(scope);
            var PrivateValue = this.GetStaticPrivateValue(scope);
            this.PostHttp(PageId, WebPartObjectID, WebPartID, WebPartPost, PublicValue, PrivateValue);
        } else if (scope.PartType == "Report")
        {
            var PublicValue = this.GetPublicValue(scope);
            var PrivateValue = this.GetReportPrivateValue(scope);
            this.PostHttp(PageId, WebPartObjectID, WebPartID, WebPartPost, PublicValue, PrivateValue);
        }
    }

    this.PostHttp = function (PageId, WebPartObjectID, WebPartID, WebPartPost, PublicValue, PrivateValue) {
        PublicValue = angular.toJson(PublicValue);
        PrivateValue = angular.toJson(PrivateValue);
        console.log()
        $http({
            method: "POST",
            url: ControllerConfig.WebParts.Save,
            data: {
                PageId: PageId,
                WebPartObjectID: WebPartObjectID,
                WebPartID: WebPartID,
                WebPartPost: WebPartPost,
                PublicValue: PublicValue,  //json
                PrivateValue: PrivateValue //json
            }
        })
    }


    this.GetPublicValue = function (value) {
        return {
            Title: value.Title,
            FunctionCode: value.FunctionCode,
            TitleVisible: value.TitleVisible,
            TitleIcon: value.TitleIcon,
            CssName: value.CssName,
            Height: value.Height,
            HeightUnit: value.HeightUnit || "px"
        }
    }


    this.GetHtmlPrivateValue = function (value) {
        return {
            ControlPath: value.ControlPath,
            MoreLink: value.MoreLink,
            MoreText: value.MoreText,
            MorePos: value.MorePos,
        }
    }

    this.GetDataModelPrivateValue = function (value) {
        var DataModelCode = angular.element("#sheetWorkflow").SheetWorkflow().GetValue();
        //BoundField  string  a|b|c,a|b|c,a|b|c
        var BoundField = "";
        angular.forEach(value.BindDataFields, function (data, index, full) {
            var a = data.AttrName + "|" + data.Len + "|" + data.Format;
            BoundField += a + ",";
        })
        BoundField = BoundField.substring(0, BoundField.length - 1)
        return {
            DataModelCode: DataModelCode,
            ShowCount: value.ShowCount,
            SortBy: value.SortBy,
            LinkFormat: value.LinkFormat,
            FindMethod: value.FindMethod,
            QueryCode: value.QueryCode,
            MoreLink: value.MoreLink,
            MoreText: value.MoreText,
            MorePos: value.MorePos,
            BoundField: BoundField
        }
    }

    this.GetStaticPrivateValue = function (value) {
        console.log(KindEditor("#StaticHtml").val())
        return {
            HtmlContent: KindEditor("#StaticHtml").val()
        }
    }
    this.GetReportPrivateValue = function (value)
    {
        return {
            ReportCode : value.ReportCode
        };
    }
}]);
