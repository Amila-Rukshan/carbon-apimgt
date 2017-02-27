$(function () {

    var apiId = $("#apiId").val();
    var swaggerClient = new SwaggerClient({
        url: swaggerURL,
        success: function (swaggerData) {

            setAuthHeader(swaggerClient);
            swaggerClient["API (individual)"].get_apis_apiId({"apiId": apiId},
                {"responseContentType": 'application/json'},
                function (jsonData) {
                    var api = jsonData.obj;
                    var callbacks = {onSuccess: function () {},onFailure: function (message, e) {}};
                    var mode = "OVERWRITE";

                    //Render Api header
                    UUFClient.renderFragment("org.wso2.carbon.apimgt.web.store.feature.api-header",api,
                        "api-header", mode, callbacks);

                    //Render Api information
                    UUFClient.renderFragment("org.wso2.carbon.apimgt.web.store.feature.api-info",api,
                        "api-info", mode, {onSuccess: function () {
                            $(".setbgcolor").generateBgcolor({
                                definite:true
                            });

                            $(".api-name-icon").each(function() {
                                var elem = $(this).next().children(".api-name");
                                $(this).nametoChar({
                                    nameElement: elem
                                });
                            });
                        },onFailure: function (message, e) {}});

                    //TODO:Since the tiers are not setting from the rest api, the default tier is attached
                    if (!api.policies || api.policies.length == 0) {
                        api.policies = ["Unlimited"];
                    }
                    UUFClient.renderFragment("org.wso2.carbon.apimgt.web.store.feature.tier-list",api,
                        "tier-list", mode, callbacks);

                    //Get application details
                    setAuthHeader(swaggerClient);
                    swaggerClient["Application Collection"].get_applications({},
                        function (jsonData) {
                            var context = {};
                            var applications = jsonData.obj.list;
                                swaggerClient["Subscription Collection"].get_subscriptions({
                                        "apiId": apiId,
                                        "applicationId": "",
                                        "responseContentType": 'application/json'
                                    }, requestMetaData(),
                                    function (jsonData) {
                                        var availableApplications = [], subscription = {};
                                        var subscriptions = jsonData.obj.list;
                                        var application = {};
                                        var subscribedApp = false;
                                        for (var i = 0; i < applications.length; i++) {
                                               subscribedApp = false;
                                                application = applications[i];
                                                for (var j = 0; j < subscriptions.length; j++) {
                                                    subscription = subscriptions[j];
                                                    if (subscription.applicationId === application.applicationId) {
                                                        subscribedApp = true;
                                                        continue;
                                                    }
                                                }
                                                if(!subscribedApp) {
                                                    availableApplications.push(application);
                                                }
                                            }
                                        var context = {};
                                        context.applications = availableApplications;

                                        //Render application list drop-down
                                        UUFClient.renderFragment("org.wso2.carbon.apimgt.web.store.feature.application-list",context,
                                            "application-list", mode, callbacks);


                                    },
                                    function (error) {
                                        alert("Error occurred while retrieve Applications" + error);
                                        if(error.status==401){
                                            redirectToLogin(contextPath);
                                        }
                                    });
                        },
                        function (error) {
                            alert("Error occurred while retrieve Applications" + error);
                            if(error.status==401){
                                redirectToLogin(contextPath);
                            }
                        });

                    //TODO: Embed actual values
                    var isAPIConsoleEnabled = true;
                    var apiType = "REST";
                    var isForumEnabled = true;

                    var tabs = [];
                    tabs.push({
                        "title": "Overview",
                        "id": "api-overview",
                        "body": [
                            {
                                "inputs": {
                                    "api": {},
                                    "user": {}
                                }
                            }
                        ]
                    });
                    tabs.push({
                        "title": "Documentation",
                        "id": "api-documentation",
                        "body": [
                            {
                                "inputs": {
                                    "api": {}
                                }
                            }
                        ]
                    });
                    if (isAPIConsoleEnabled && apiType.toUpperCase() != "WS") {
                        tabs.push({
                            "title": "API Console",
                            "id": "api-swagger",
                            "body": [
                                {
                                    "inputs": {
                                        "api": {},
                                        "subscriptions": []
                                    }
                                }
                            ]
                        })

                    }

                    if (isForumEnabled) {
                        tabs.push({
                            "title": "Forum",
                            "id": "forum-list",
                            "body": [
                                {
                                    "inputs": {
                                        "api": {},
                                        "uriTemplates": {}
                                    }
                                }
                            ]
                        });
                    }

                    for (var i = 0; i < tabs.length; i++) {
                        if (i == 0) {
                            tabs[i].tabClass = "first active";
                            tabs[i].contentClass = "in active";
                        } else if (i == tabs.length - 1) {
                            tabs[tabs.length - 1].tabclass = "last"
                        }
                    }

                       var context = {};
                        context.tabList = tabs;
                    var callback = {onSuccess: function ( tabdata
                    ) {
                        $("#tab-list").append(tabdata);
                        //Load each tab content
                        for (var i = 0; i < tabs.length; i++) {
                            var tab = tabs[i];
                            if (tab.id == "api-overview") {
                                for (var endpointURL in  api.endpointURLs) {
                                    var environmentURLs = api.endpointURLs[endpointURL].environmentURLs;
                                    for (var environmentURL in environmentURLs) {
                                        var currentEnvironmentURL = [];
                                        currentEnvironmentURL.push(environmentURLs[environmentURL]);
                                        if (api.isDefaultVersion) {
                                            var defaultEnvironmentURL = null;
                                            defaultEnvironmentURL = environmentURLs[environmentURL].replace(api.version + "/", "");
                                            defaultEnvironmentURL = environmentURLs[environmentURL].replace(api.version, "");
                                            currentEnvironmentURL.push(defaultEnvironmentURL);
                                        }
                                        api.endpointURLs[endpointURL].environmentURLs[environmentURL] = currentEnvironmentURL;
                                    }
                                }
                                context.api = api;
                                UUFClient.renderFragment("org.wso2.carbon.apimgt.web.store.feature.api-overview",context, {
                                    onSuccess: function (renderedData) {
                                        $("#api-overview").append(renderedData);
                                        setOverviewTabData();

                                    }.bind(context), onFailure: function (message, e) {
                                        var message = "Error occurred while getting api overview details." + message;
                                        noty({
                                            text: message,
                                            type: 'error',
                                            dismissQueue: true,
                                            modal: true,
                                            progressBar: true,
                                            timeout: 2000,
                                            layout: 'top',
                                            theme: 'relax',
                                            maxVisible: 10,
                                        });
                                    }
                                });
                            }

                            if (tab.id == "api-documentation") {
                                setAuthHeader(swaggerClient);
                                swaggerClient["API (individual)"].get_apis_apiId_documents({"apiId": apiId}, {"responseContentType": 'application/json'},
                                    function (jsonData) {

                                        var documentationList = jsonData.obj.list, length, documentations = {}, doc, obj;

                                        if (documentationList != null) {
                                            length = documentationList.length;
                                        }
                                        for (i = 0; i < length; i++) {
                                            doc = documentationList[i];
                                            //TODO: Remove this once comparison helper is implemented
                                            if (doc.sourceType == "INLINE") {
                                                doc.isInLine = true;
                                            } else if (doc.sourceType == "FILE") {
                                                doc.isFile = true;
                                            } else if (doc.sourceType == "URL") {
                                                doc.isURL = true;
                                            }
                                            obj = documentations[doc.type] || (documentations[doc.type] = []);
                                            obj.push(doc);
                                        }

                                        for (var type in documentations) {
                                            if (documentations.hasOwnProperty(type)) {
                                                var docs = documentations[type], icon = null, typeName = null;
                                                if (type.toUpperCase() == "HOWTO") {
                                                    icon = "fw-info";
                                                    typeName = "HOW TO";
                                                } else if (type.toUpperCase() == "PUBLIC_FORUM") {
                                                    icon = "fw-forum";
                                                    typeName = "PUBLIC FORUM";
                                                } else if (type.toUpperCase() == "SUPPORT_FORUM") {
                                                    icon = "fw-forum";
                                                    typeName = "SUPPORT FORUM";
                                                } else if (type.toUpperCase() == "SAMPLES") {
                                                    icon = "fw-api";
                                                    typeName = "SAMPLES";
                                                } else {
                                                    icon = "fw-text";
                                                    typeName = "OTHER";
                                                }
                                                documentations[type].icon = icon;
                                                documentations[type].typeName = typeName;
                                            }
                                        }
                                        $.get('/store/public/components/root/base/templates/apis/{apiId}/api-documentations.hbs', function (templateData) {
                                            context.documentations = documentations;
                                            var apiOverviewTemplate = Handlebars.compile(templateData);
                                            // Inject template data
                                            var compiledTemplate = apiOverviewTemplate(context);

                                            // Append compiled template into page
                                            $("#api-documentation").append(compiledTemplate);

                                        }, 'html');
                                    });

                            }

                        }
                    }.bind(context),onFailure: function (message, e) {
                        var message = "Error occurred while viewing API details";
                        noty({
                            text: message,
                            type: 'error',
                            dismissQueue: true,
                            modal: true,
                            progressBar: true,
                            timeout: 2000,
                            layout: 'top',
                            theme: 'relax',
                            maxVisible: 10,
                        });
                    }};
                    UUFClient.renderFragment("org.wso2.carbon.apimgt.web.store.feature.api-detail-tab-list",context,
                         callback);


                },
                function (jqXHR, textStatus, errorThrown) {
                    alert("Error occurred while retrieve api with id  : " + apiId);
                    if(jqXHR.status==401){
                        redirectToLogin(contextPath);
                    }
                });

            $('.page-content').on('click', 'button', function (e) {
                var element = e.target;
                if (element.id == "subscribe-button") {
                    var applicationId = $("#application-list option:selected").val();
                    if (applicationId == "-" || applicationId == "createNewApp") {
                        var message = "Please select an application before subscribing";
                        noty({
                            text: message,
                            type: 'warning',
                            dismissQueue: true,
                            modal: true,
                            progressBar: true,
                            timeout: 2000,
                            layout: 'top',
                            theme: 'relax',
                            maxVisible: 10,
                        });
                        return;
                    }
                    $(this).html(i18n.t('Please wait...')).attr('disabled', 'disabled');
                    var tier = $("#tiers-list").val();
                    var apiIdentifier = $("#apiId").val();


                    var subscriptionData = {};
                    subscriptionData.policy = tier;
                    subscriptionData.applicationId = applicationId;
                    subscriptionData.apiIdentifier = apiIdentifier;
                    setAuthHeader(swaggerClient);
                    swaggerClient["Subscription (individual)"].post_subscriptions({
                            "body": subscriptionData,
                            "Content-Type": "application/json"
                        },
                        function (jsonData) {
                            $("#subscribe-button").html('Subscribe');
                            $("#subscribe-button").removeAttr('disabled');
                            var subscription = jsonData.obj;
                            var message = "You have successfully subscribed to the API.";
                            noty({
                                text: message,
                                layout: "top",
                                theme: 'relax',
                                buttons: [
                                    {addClass: 'btn btn-primary', text: 'View Subscriptions', onClick: function($noty) {
                                        $noty.close();
                                        location.href = contextPath + "/applications/" + applicationId + "#subscription";
                                      }
                                    },
                                    {addClass: 'btn btn-default', text: 'Stay on this page', onClick: function($noty) {
                                        $noty.close();
                                        location.href = contextPath + "/apis/" + apiId;
                                      }
                                    }
                                  ]
                            });

                            //TODO : Embedding message model


                        },
                        function (error) {
                            alert("Error occurred while adding Application : " + applicationName);
                        });
                }

            });
        },
        failure : function(error){
            console.log("Error occurred while loading swagger definition");
        }



    });
});


function applicationSelectionChange() {
    var apiId = $("#apiId").val();
    var selectedVal = $('#application-list option:selected').val();
    if(selectedVal == "createNewApp") {
        location.href = contextPath + "/applications/add?goBack=yes&apiId="+ apiId;
    }
}

function setOverviewTabData() {
    var link = window.location+'';
    $('#api_mailto').on("click",function(){
        location.href = "mailto:?Subject="+encodeURIComponent(document.title)+"&body=Link : "+ encodeURIComponent(window.location);
    });
    $('#embed_iframe').text('<iframe width="450" height="120" src="'+link.replace('info','widget')+'" frameborder="0" allowfullscreen></iframe>');
    $('#embed-copy').attr('data-clipboard-text', '<iframe width="450" height="120" src="'+link.replace('info','widget')+'" frameborder="0" allowfullscreen></iframe>');

    $('.share_links,#api_mailto').click(function(){
        $('.share_links,#api_mailto').parent().removeClass('active');
        $(this).parent().addClass('active');
        $('.share_dives').hide();
        $('#share_div_' + $(this).attr('ref')).show();
        return false;
    });
    var api_url = encodeURIComponent(window.location+'');
    var description = document.title + " : try this API at "+window.location;
    $("#facebook").attr("href","http://www.facebook.com/sharer.php?u="+api_url);
    $("#twitter").attr("href","http://twitter.com/share?url="+api_url+"&text="+encodeURIComponent(description));
    $("#googleplus").attr("href","https://plus.google.com/share?url="+api_url);
    $("#digg").attr("href","http://www.digg.com/submit?url="+api_url);
}


































