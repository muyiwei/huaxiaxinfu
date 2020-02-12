module.factory('sheetUserService', function (httpService) {
    return {
        //用户
        sheetUser: function () {
            this.id;
            this.name;
            this.checked = false;
            this.Icon = "";
            this.ChildrenCount;
            this.DepartmentName;
        },
        //组织架构
        organization: function () {
            this.id;
            this.pid = null;
            this.deptName;
            this.isLeaf;
            this.ChildrenCount;
            this.unitType;
            this.checked = false;
            this.children = [];
            this.users = null;
            this.Icon = "";
        },
        //检查是否被选中，同步列表中数据
        checkItems: function (users, items) {
            if (!users || users.length == 0) {
                return users;
            } else if (items.length == 0) {
                users.forEach(function (n, i) {
                    n.checked = false;
                })
            } else {
                users.forEach(function (n, i) {
                    //if (n.checked) return;
                    n.checked = false;
                    for (var index = 0; index < items.length; index++) {
                        var element = items[index];
                        if (element.id === n.id) {
                            n.checked = true;
                        }
                    }
                });
            }
            return users;
        },
        //检查是否被删除,同步列表中数据
        deleteSelectItem: function (arry, selectItems) {
            if (!arry || arry.length == 0 || arry.length == 0) return arry;
            arry.forEach(function (n, i) {
                if (n.checked == true) {
                    var IsDelete = true;
                    for (var i = 0; i < selectItems.length; i++) {
                        if (n.id == selectItems[i].id) {
                            IsDelete = false;
                        }
                    }
                    if (IsDelete) {
                        n.checked = false;
                    }
                }
            });
            return arry;
        },
        //初始化已选
        initItems: function (users) {
            var objs = [];
            if (users) {
                if (users.constructor == Object) {
                    var tempUser = { id: users.Code, name: users.Name, type: users.ContentType, UserGender: users.UserGender, UserImageUrl: users.UserImageUrl };
                    objs.push(tempUser);
                } else {
                    users.forEach(function (n, i) {
                        var tempUser = { id: n.Code, name: n.Name, type: n.ContentType, UserGender: n.UserGender, UserImageUrl: n.UserImageUrl };
                        objs.push(tempUser);
                    });
                }
            }
            return objs;
        },
        //获取当前选项数据
        getDept: function (obj, id) {
            var depts = {};
            var getDept = function (obj, id) {
                var success = false;
                if (obj.children) {
                    obj.children.forEach(function (n, i) {
                        if (n.id == id) {
                            success = true;
                            depts = n;
                        }
                    });
                    if (!success) {
                        obj.children.forEach(function (n, i) {
                            getDept(n, id);
                        });
                    }
                }
            };
            getDept(obj, id);
            return depts;
        },
        //删除已选
        removeItem: function (arry, obj) {
            arry.forEach(function (n, i) {
                if (n.id == obj.id) {
                    items = arry.splice(i, 1);
                }
            });
            return arry;
        },
        //获取已选名称
        getSelectedName: function (items) {
            var names = '已选：';
            if (items.length == 0) {
                names = "";
            }
            else if (items.length < 3) {
                items.forEach(function (n, i) {
                    names += n.name + '、';
                });
                names = names.substring(0, names.length - 1);
            } else {
                for (var i = 0; i < 2; i++) {
                    names += items[i].name + '、';
                }
                names = names.substring(0, names.length - 1);
                names += '...等 ' + items.length + ' 人';
            }
            return names;
        },
        //获取数据
        loadData: function (url, param, isJsonp) {
            return httpService.get(url, param, isJsonp);
        },
        //组织架构适配器
        sheetOrgAdapter: function (orgs, pid, the) {
            if (!orgs) return {};
            //将返回的ligerTree数据转换为ionic。
            if (!the) the = this;
            var ogranization = new the.organization();
            ogranization.id = orgs.Code;
            ogranization.pid = pid;
            ogranization.deptName = orgs.Text;
            if (orgs.ExtendObject) {
                ogranization.unitType = orgs.ExtendObject.UnitType;
                ogranization.isLeaf = !orgs.ExtendObject.HasChildren;
                ogranization.ChildrenCount = orgs.ExtendObject.ChildrenCount;
            }
            //默认选中根节点
            if (!pid)
                ogranization.checked = true;
            if (orgs.children) {
                var loadOptions = $.MvcSheetUI.sheetUserParams.loadOptions.split("=");
                if (loadOptions.length == 2) {
                    loadOptions = loadOptions[1].toLowerCase();
                } else {
                    loadOptions = "";
                }

                var UnitArry = [];
                var GroupArry = [];
                var UsersArry = [];
                orgs.children.forEach(function (n, i) {
                    switch (n.ExtendObject.UnitType.toLowerCase()) {
                        case 'u':
                            var user = new the.sheetUser();
                            user.id = n.ObjectID;
                            user.name = n.Text;
                            user.Icon = "task-sort-icon fa  fa-user";
                            UsersArry.push(user);
                            break;
                        case 'o':
                            var child = the.sheetOrgAdapter(n, orgs.Code, the);
                            child.Icon = "task-sort-icon fa icon-zuzhitubiao"
                            ogranization.children.push(child);
                            if (loadOptions.indexOf("o") > -1) {
                                var user = new the.sheetUser();
                                user.id = n.ObjectID;
                                user.name = n.Text;
                                user.Icon = "task-sort-icon fa icon-zuzhitubiao";
                                UnitArry.push(user);
                            }
                            break;
                        case 'g':
                            var child = the.sheetOrgAdapter(n, orgs.Code, the);
                            child.Icon = "task-sort-icon fa  fa fa-users";
                            ogranization.children.push(child);
                            if (loadOptions.indexOf("g") > -1) {
                                var user = new the.sheetUser();
                                user.id = n.ObjectID;
                                user.name = n.Text;
                                user.Icon = "task-sort-icon fa  fa fa-users";
                                GroupArry.push(user);
                            }
                        default:
                            break;
                    }
                });

                //排序 组织->组->用户
                if (UnitArry.length > 0 || UnitArry.length > 0 || UnitArry.length > 0) {
                    if (!ogranization.users) ogranization.users = [];
                    ogranization.users = ogranization.users.concat(UnitArry);
                    ogranization.users = ogranization.users.concat(GroupArry);
                    ogranization.users = ogranization.users.concat(UsersArry);
                }
            }
            return ogranization;
        },
        //用户适配器

        //用户，是否允许选择组、OU、用户的标识
        sheetUserAdapter: function (users, selecFlag) { 
            selecFlag = selecFlag ? selecFlag : "";
            var sheetUsers = [];
            var the = this;
            if (!users || users.length === 0) return sheetUsers;
            var UnitArry = [];
            var GroupArry = [];
            var UsersArry = [];
            users.forEach(function (n, i) {
                var sheetUser = new the.sheetUser();
                sheetUser.id = n.ObjectID;
                sheetUser.code = n.Code;
                sheetUser.name = n.Text;
                sheetUser.fullname = n.Text + " [" + n.Code + "]";
                sheetUser.Icon = n.Icon;
                sheetUser.canSelect = false;
                if (n.ExtendObject) {
                    sheetUser.ChildrenCount = n.ExtendObject.ChildrenCount;
                    sheetUser.DepartmentName = n.ExtendObject.DepartmentName;
                    sheetUser.UserGender = n.ExtendObject.UserGender;
                    sheetUser.UserImageUrl = n.ExtendObject.UserImageUrl;
                }
                //OrgUnitVisible——o;GroupVisible——g;UserVisible——u
                if (n.Icon.indexOf("icon-zuzhitubiao") > -1) {
                    sheetUser.type = "O";

                    UnitArry.push(sheetUser);//组织
                } else if (n.Icon.indexOf("fa-users") > -1) {
                    sheetUser.type = "G";
                    GroupArry.push(sheetUser);//组
                } else {
                    sheetUser.type = "U";
                    UsersArry.push(sheetUser);//人员
                }

                if (selecFlag.indexOf(sheetUser.type) > -1) {
                    sheetUser.canSelect = true;
                }
            });
            //排序
            sheetUsers = sheetUsers.concat(UnitArry);
            sheetUsers = sheetUsers.concat(GroupArry);
            sheetUsers = sheetUsers.concat(UsersArry);
            return sheetUsers;
        },
        //转化为sheeUser.js中所需对象
        convertItems: function (items) {
            if (!items) return [];
            if (items.length == 1) {
                var obj = { Code: items[0].id, Name: items[0].name, ContentType: items[0].type, UserGender: items[0].UserGender, UserImageUrl: items[0].UserImageUrl };
                return obj;
            } else {
                var objs = [];
                items.forEach(function (n, i) {
                    objs.push({ Code: n.id, Name: n.name, ContentType: n.type, UserGender: n.UserGender, UserImageUrl: n.UserImageUrl });
                });
                return objs;
            }
        }
    };
});