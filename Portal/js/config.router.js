'use strict';
/**
 * 路由配置
 */
angular.module('app')
  .run(
    ['$rootScope','$location', '$compile', '$state', '$stateParams',
      function ($rootScope,$location, $compile, $state, $stateParams) {
          $rootScope.$state = $state;
          $rootScope.$stateParams = $stateParams;
        
          $rootScope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
              //to be used for back button  
              ////won`t work when page is reloaded.
              $rootScope.previousState_name = fromState.name;
              $rootScope.previousState_params = fromParams;
              

              ////判断菜单根目录是否是
              //if (toParams.TopAppCode != fromParams.TopAppCode && fromParams.TopAppCode && toParams.TopAppCode) {
              //    var u = navigator.userAgent;
              //    //如果是火狐浏览器 解决火狐浏览器的兼容性问题
              //    if (u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1) {
              //      //因为火狐浏览器优先读取缓存，所以先刷新页面在打开指定url
              //        var url = $location.$$absUrl;
              //        var parm = parseInt(Math.random() * 101100);
              //        if ($location.$$absUrl.lastIndexOf('?') > -1) {
              //            url = url + parm;
              //        } else {
              //            url = url + "?" + parm;
              //        }

              //        window.location.href = url; 
              //        location.reload();
                    
              //    } 
              //    else {
              //            window.location.reload();                    
              //    }

             // }
              
          });
          $rootScope.back = function () {
              $state.go($rootScope.previousState_name, $rootScope.previousState_params);
          }
      }
    ]
  )
  .config(
    ['$stateProvider', '$urlRouterProvider',
      function ($stateProvider, $urlRouterProvider) {
          // 默认页面
          $urlRouterProvider.otherwise('/app/Workflow/MyUnfinishedWorkItem');
          $stateProvider
              // 平台页面基类
              .state('platform', {
                  url: '/platform',
                  abstract: true,
                  template: '<div ui-view class="fade-in-right-big smooth"></div>'
              })
              // 登录界面
              .state('platform.login', {
                  url: '/login',
                  controller: 'LoginController',
                  templateUrl: 'template/login.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/LoginController.js',
                                'js/directives/app-directive.js?v=201802231',
                            ]);
                        }]
                  }
              })
              // 主页面基类
              .state('app', {
                  abstract: true,
                  url: '/app/:TopAppCode',
                  templateUrl: 'template/app.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                          function ($ocLazyLoad) {
                              return $ocLazyLoad.load([
                                  //'css/bootstrap.css',
                                  //'css/animate.css',
                                  //'css/font-awesome.min.css',
                                  //'css/simple-line-icons.css',
                                  //'css/font.css',
                                  //'css/app.css',
                                  //'css/appExtend.css',
                                  //'vendor/jquery/file/fileinput.min.css',
                                  'js/directives/app-directive.js?v=201802231',
                                  'vendor/jquery/datatables/jquery.dataTables.min.js',
                              ]);
                          }
                      ]
                  }
              })
              // 主页门户面基类
              .state('appTemplate', {
                  abstract: true,
                  url: '/appTemplate',
                  templateUrl: 'template/appTemplates.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                          function ($ocLazyLoad) {
                              return $ocLazyLoad.load([
                                 
                                  'js/directives/app-directive.js?v=201802231',
                              ]);
                          }
                      ]
                  }
              })
              //首页-门户
              .state('home', {
                  url: '/home/:PageId/:Mode',
                  templateUrl: 'template/default.html',
                  controller: "DefaultController",
                  resolve: {
                      deps: ['$ocLazyLoad',
                          function ($ocLazyLoad) {
                              return $ocLazyLoad.load([
                                   'WFRes/_Content/themes/ligerUI/Aqua/css/ligerui-all.css',
                                   //'WFRes/assets/stylesheets/sheet.css',
                                   'vendor/jquery/jquery-ui/core.js',
                                   'vendor/jquery/jquery-ui/widget.js',

                                    'css/H3Report/bootstrap-datetimepicker/bootstrap-datetimepicker.css',
                                    'css/H3Report/bootstrap-multiselect/bootstrap-multiselect.css',
                                    'css/H3Report/dataTables-bootstrap/dataTables.bootstrap.min.css',
                                    'css/H3Report/autocomplete/jquery.autocomplete.css',
                                    'css/H3Report/SheetUser.css',
                                    'css/H3Report/PageTurn.css',
                                    'css/H3Report/H3-Icon-Tool/style.css',
                                    'css/H3Report/ChartBase.css',
                                    'css/H3Report/DropDownList.css',
                                    'css/H3Report/Reporting/ReportView.css',
                                    'css/H3Report/jquery.gritter.css',

                                    'admin/MvcDesigner/Lib/aspx.css',
                                    'admin/MvcDesigner/Lib/codemirror.js',
                                    
                              ]).then(function () {
                                  return $ocLazyLoad.load([
                                   'vendor/jquery/jquery-ui/mouse.js',
                                   'vendor/jquery/jquery-ui/draggable.js',
                                   'vendor/jquery/jquery-ui/droppable.js',
                                   'vendor/jquery/jquery-ui/sortable.js',
                                   'vendor/jquery/jqueryui-touch-punch/jquery.ui.touch-punch.min.js',
                                   'js/controllers/DefaultController.js',

                                    'js/H3Report/jquery.gritter.min.js',
                                    'js/H3Report/H3.plugins.system.js',
                                    'js/H3Report/bootstraptable/bootstrap-datetimepicker.js',
                                    'js/H3Report/bootstraptable/jquery.nicescroll.min.js',
                                    'js/H3Report/bootstraptable/bootstrap-datetimepicker.zh-CN.js',
                                    'js/H3Report/bootstraptable/bootstrap-table.js',
                                    'js/H3Report/bootstraptable/bootstrap-table-zh-CN.js',
                                    //'js/H3Report/dataTables/dataTables.bootstrap.js',
                                    'vendor/jquery/datatables/jquery.dataTables.min.js',
                                    //'js/H3Report/Form/BaseControl.js',
                                    //'js/H3Report/Form/ControlManager.js',
                                    // 'js/H3Report/Form/SmartForm.js',
                                    //'js/H3Report/Form/FormControls.js',
                                    //'js/H3Report/Form/Controls/FormUser.js',
                                    'js/H3Report/echart/echarts.js',
                                    'js/H3Report/Reporting/Report/ReportBase.js',
                                    'js/H3Report/Reporting/ReportViewManagerPc.js',
                                    'js/H3Report/bootstrap-multiselect/bootstrap-multiselect.js',
                                    'js/H3Report/H3Chart/ChartBase.js',
                                    'js/H3Report/H3Chart/excanvas.min.js',
                                    'js/H3Report/H3Chart/Chart.js',
                                    'js/H3Report/html2canvas.js',
                                    'WFRes/_Scripts/jquery/jquery.lang.js',
                                    'WFRes/_Scripts/ligerUI/ligerui.all.js',
                                     
                                  ]);
                              });
                          }
                      ]
                  }
              })

             //————门户管理————
             //门户管理—模板管理
              .state('appTemplate.PortalTemplates', {
                  url: '/PortalTemplates',
                  controller: "PortalTemplatesController",
                  templateUrl: 'template/Templates/PortalTemplates.html',
                  resolve: {
                      deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                          return $ocLazyLoad.load([
                              'js/controllers/Templates/PortalTemplatesController.js',
                              //在线代码编辑
                              'admin/MvcDesigner/Lib/aspx.css',
                              'admin/MvcDesigner/Lib/codemirror.js',
                          ]).then(function () {
                              return $ocLazyLoad.load([
                                    'admin/MvcDesigner/Lib/matchbrackets.js',
                                    'admin/MvcDesigner/Lib/xml.js',
                                    'admin/MvcDesigner/Lib/javascript.js',
                                    'admin/MvcDesigner/Lib/css.js',
                                    'admin/MvcDesigner/Lib/htmlmixed.js',
                                    'admin/MvcDesigner/Lib/htmlembedded.js',
                                    'admin/MvcDesigner/Lib/fullscreen.js',
                                    'admin/MvcDesigner/Lib/clike.js'
                              ]);
                          });
                      }]
                  }
              })
              //门户管理—模板管理
              .state('appTemplate.PortalPageManeger', {
                  url: '/PortalPageManeger',
                  controller: "PortalPageManegerController",
                  templateUrl: 'template/Templates/PortalPageManeger.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                          function ($ocLazyLoad) {
                              return $ocLazyLoad.load([
                                  'js/controllers/Templates/PortalPageManegerController.js',
                                 // 'WFRes/_Scripts/ligerUI/ligerui.all.js'
                              ]);
                          }
                      ]
                  }
              })

              //————流程中心————
              //待办
                .state('app.MyUnfinishedWorkItem', {
                    url: '/MyUnfinishedWorkItem',
                    controller: "MyUnfinishedWorkItemController",
                    templateUrl: 'template/ProcessCenter/MyUnfinishedWorkItem.html',
                    resolve: {
                        deps: ['$ocLazyLoad',
                            function ($ocLazyLoad) {
                                return $ocLazyLoad.load([
                                    'js/controllers/ProcessCenter/MyUnfinishedWorkItemController.js',
                                ]);
                            }
                        ]
                    }
                })
              //待办-分组模式
              .state('app.MyUnfinishedWorkItemByGroup', {
                  url: '/MyUnfinishedWorkItemByGroup',
                  cache: false,
                  controller: "MyUnfinishedWorkItemByGroupController",
                  templateUrl: 'template/ProcessCenter/MyUnfinishedWorkItemByGroup.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/MyUnfinishedWorkItemByGroupController.js',
                            ]);
                        }
                      ]
                  }
              })
               //待办-批量审批模式
              .state('app.MyUnfinishedWorkItemByBatch', {
                  url: '/MyUnfinishedWorkItemByBatch',
                  controller: "MyUnfinishedWorkItemByBatchController",
                  templateUrl: 'template/ProcessCenter/MyUnfinishedWorkItemByBatch.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/MyUnfinishedWorkItemByBatchController.js?v=2018022701'
                            ]);
                        }
                      ]
                  }
              })
              //WorkItemDetail
              .state('app.WorkItemDetail', {
                  url: '/WorkItemDetail',
                  controller: "WorkItemDetailController",
                  templateUrl: 'template/ProcessCenter/WorkItemDetail.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load(['js/controllers/ProcessCenter/WorkItemDetailController.js']);
                        }
                      ]
                  }
              })
              //待阅
              .state('app.MyUnReadWorkItem', {
                  url: '/MyUnReadWorkItem',
                  controller: "MyUnReadWorkItemController",
                  templateUrl: 'template/ProcessCenter/MyUnReadWorkItem.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/MyUnReadWorkItemController.js'
                            ]);
                        }
                      ]
                  }
              })
              //发起
              .state('app.MyWorkflow', {
                  url: '/MyWorkflow',
                  controller: "MyWorkflowController",
                  templateUrl: 'template/ProcessCenter/MyWorkflow.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/MyWorkflowController.js',
                               // 'vendor/jquery/bootstrapTable/bootstrap-table.js?r='+Math.floor(Math.random()*100),
                                'vendor/jquery/bootstrapTable/bootstrap-table.js',
                            ]);
                        }
                      ]
                  }
              })
              //已办
              .state('app.MyFinishedWorkItem', {
                  url: '/MyFinishedWorkItem',
                  controller: "MyFinishedWorkItemController",
                  templateUrl: 'template/ProcessCenter/MyFinishedWorkItem.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/MyFinishedWorkItemController.js',
                            ]);
                        }
                      ]
                  }
              })
              //已阅
              .state('app.MyReadWorkItem', {
                  url: '/MyReadWorkItem',
                  controller: "MyReadWorkItemController",
                  templateUrl: 'template/ProcessCenter/MyReadWorkItem.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                               'js/controllers/ProcessCenter/MyReadWorkItemController.js',
                            ]);
                        }
                      ]
                  }
              })
              //我的流程
              .state('app.MyInstance', {
                  url: '/MyInstance/:SchemaCode/:State',
                  controller: "MyInstanceController",
                  templateUrl: 'template/ProcessCenter/MyInstance.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/MyInstanceController.js',
                                'vendor/jquery/bootstrap.js',
                            ]);
                        }
                      ]
                  }
              })
              //查询流程实例
              .state('app.QueryInstance', {
                  url: '/QueryInstance',
                  controller: "QueryInstanceController",
                  templateUrl: 'template/ProcessCenter/QueryInstance.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                  'vendor/jquery/bootstrap.js',
                                  'js/controllers/ProcessCenter/QueryInstanceController.js'
                            ]);
                        }
                      ]
                  }
              })
              //查询任务
              .state('app.QueryParticipantWorkItem', {
                  url: '/QueryParticipantWorkItem',
                  controller: "QueryParticipantWorkItemController",
                  templateUrl: 'template/ProcessCenter/QueryParticipantWorkItem.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/QueryParticipantWorkItemController.js',
                            ]);
                        }
                      ]
                  }
              })
              //导出流程数据
              .state('app.ExportInstanceData', {
                  url: '/ExportInstanceData',
                  controller: "ExportInstanceDataController",
                  templateUrl: 'template/ProcessCenter/ExportInstanceData.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                //jquery.dataTables.min.js、dataTables.bootstrap.js 不能互换加载顺序
                                'vendor/jquery/datatables/jquery.dataTables.min.js',
                                'vendor/jquery/datatables/dataTables.bootstrap.css'
                            ]).then(function () {
                                return $ocLazyLoad.load([
                                    'vendor/jquery/datatables/dataTables.bootstrap.js',
                                    'js/controllers/ProcessCenter/ExportInstanceDataController.js',
                                ])
                            });
                        }
                      ]
                  }
              })
              //超时的任务
              .state('app.QueryElapsedWorkItem', {
                  url: '/QueryElapsedWorkItem',
                  controller: "QueryElapsedWorkItemController",
                  templateUrl: 'template/ProcessCenter/QueryElapsedWorkItem.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/QueryElapsedWorkItemController.js',
                            ]);
                        }
                      ]
                  }
              })
              //超时的流程
              .state('app.QueryElapsedInstance', {
                  url: '/QueryElapsedInstance',
                  controller: "QueryElapsedInstanceController",
                  templateUrl: 'template/ProcessCenter/QueryElapsedInstance.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/QueryElapsedInstanceController.js',
                            ]);
                        }
                      ]
                  }
              })
              //任务委托
              .state('app.MyAgents', {
                  url: '/MyAgents',
                  controller: "MyAgentsController",
                  templateUrl: 'template/ProcessCenter/MyAgents.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/MyAgentsController.js?v=20180226189',
                                'js/services/notify.js',
                            ]);
                        }
                      ]
                  }
              })
              //常用意见
              .state('app.MyComments', {
                  url: '/MyComments',
                  controller: "MyCommentsController",
                  templateUrl: 'template/ProcessCenter/MyComments.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/MyCommentsController.js',
                                'vendor/jquery/bootstrap.js']);
                        }
                      ]
                  }
              })
              //签章设置
              .state('app.MySignature', {
                  url: '/MySignature',
                  controller: "MySignatureController",
                  templateUrl: 'template/ProcessCenter/MySignature.html',
                  resolve: {
                      deps: ['$ocLazyLoad',
                        function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'js/controllers/ProcessCenter/MySignatureController.js',
                                'vendor/angular/angular-file/ng-file-upload-shim.js',
                                'vendor/angular/angular-file/ng-file-upload.js',
                            ]);
                        }
                      ]
                  }
              })
              //外链跳转
              .state('app.GoHref', {
                  url: '/GoHref/:Params'
              })
              // 报表展示
              .state('app.ShowReport', {
                  url: '/ShowReport/:ReportCode/:Params',
                  controller: 'ShowReportControler',
                  templateUrl: 'template/ReportCenter/ShowReport.html',
                  resolve: {
                      deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                          return $ocLazyLoad.load([
                             
                            // 'css/H3Report/bootstrap.min.css',
                             'css/H3Report/bootstrap-datetimepicker/bootstrap-datetimepicker.css',
                             'css/H3Report/bootstrap-multiselect/bootstrap-multiselect.css',
                             'css/H3Report/dataTables-bootstrap/dataTables.bootstrap.min.css',
                             //'css/H3Report/bootstraptable/bootstrap-table.css',
                             'css/H3Report/autocomplete/jquery.autocomplete.css',
                             
                             'css/H3Report/SheetUser.css',
                            
                             'css/H3Report/PageTurn.css',
                             'css/H3Report/H3-Icon-Tool/style.css',
                             'css/H3Report/ChartBase.css',
                             'css/H3Report/DropDownList.css',
                               'css/H3Report/Reporting/ReportView.css',
                               'js/controllers/ReportCenter/ShowReportControler.js',
                          ])
                      }]
                  }
              })

              //流程状态-发起模式链接
               .state('WorkflowInfo', {
                   url: '/WorkflowInfo/:InstanceID/:WorkItemID/:WorkflowCode/:WorkflowVersion',
                   controller: 'WorkflowInfoController',
                   templateUrl: 'template/ProcessCenter/WorkflowInfo.html',
                   resolve: {
                       deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                           return $ocLazyLoad.load([
                               'WFRes/assets/stylesheets/sheet.css',
                                'js/controllers/ProcessCenter/WorkflowInfoController.js',
                           ]);
                       }]
                   }
               })
              //流程状态-任务链接
              .state('InstanceDetail', {
                  url: '/InstanceDetail/:InstanceID/:WorkItemID/:WorkflowCode/:WorkflowVersion',
                  controller: 'InstanceDetailController',
                  templateUrl: 'template/ProcessCenter/InstanceDetail.html',
                  resolve: {
                      deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                          return $ocLazyLoad.load([
                               'WFRes/_Content/themes/ligerUI/Aqua/css/ligerui-all.css',
                               'WFRes/assets/stylesheets/sheet.css',
                               'js/directives/app-directive.js?v=201802231',
                               'js/controllers/ProcessCenter/InstanceDetailController.js',
                          ]);
                      }]
                  }
              })
              //流程状态-任务链接
              .state('app.InstanceDetail', {
                  url: '/InstanceDetail/:InstanceID/:WorkItemID/:WorkflowCode/:WorkflowVersion',
                  controller: 'InstanceDetailController',
                  templateUrl: 'template/ProcessCenter/InstanceDetail.html',
                  resolve: {
                      deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                          return $ocLazyLoad.load([
                               'WFRes/_Content/themes/ligerUI/Aqua/css/ligerui-all.css',
                               //'WFRes/assets/stylesheets/sheet.css',
                               'js/controllers/ProcessCenter/InstanceDetailController.js',
                          ]);
                      }]
                  }
              })
              //用户操作日志
              .state('InstanceUserLog', {
                  url: '/InstanceUserLog/:InstanceID',
                  controller: 'InstanceUserLogController',
                  templateUrl: 'template/ProcessCenter/InstanceUserLog.html',
                  resolve: {
                      deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                          return $ocLazyLoad.load([
                              'js/controllers/ProcessCenter/InstanceDetailController.js',
                          ])
                      }]
                  }
              })

          /*
          自定义页面
          */

          //应用中心-任务列表
           .state('app.MyWorkItem', {
               url: '/MyWorkItem/:SchemaCode/:State/:FunctionCode',
               controller: 'MyWorkItemController',
               templateUrl: 'template/AppCenter/MyWorkItem.html',
               resolve: {
                   deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                       return $ocLazyLoad.load([
                           'js/controllers/AppCenter/MyWorkItemController.js',
                       ])
                   }]
               }
           })

            //应用中心-表单
            .state('app.EditBizObject', {
                url: '/EditBizObject/:SchemaCode/:SheetCode/:Mode/:FunctionCode',
                template: "<div></div>",
                controller: "EditBizObjectController",
                resolve: {
                    deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            'js/controllers/AppCenter/EditBizObjectController.js',
                        ])
                    }]
                }
            })
            //应用中心-查询列表
           .state('app.BizQueryView', {
               url: '/BizQueryView/:SchemaCode/:QueryCode/:FunctionCode',
               controller: 'BizQueryViewController',
               templateUrl: 'template/AppCenter/BizQueryView.html?t=' + Math.floor(Date.now() / 1000),
               resolve: {
                   deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                       return $ocLazyLoad.load([
                           'WFRes/_Scripts/jquery/jquery.lang.js',
                           'WFRes/_Scripts/bizquery.js',
                       ]).then(function () {
                           return $ocLazyLoad.load([
                                'js/controllers/AppCenter/BizQueryViewController.js',
                           ]);
                       });
                   }]
               }
           })
          // End
      }
    ]
  );