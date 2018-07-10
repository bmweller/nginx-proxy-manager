'use strict';

const Mn             = require('backbone.marionette');
const ProxyHostModel = require('../../../models/proxy-host');
const Api            = require('../../api');
const Cache          = require('../../cache');
const Controller     = require('../../controller');
const ListView       = require('./list/main');
const ErrorView      = require('../../error/main');
const template       = require('./main.ejs');
const EmptyView      = require('../../empty/main');

module.exports = Mn.View.extend({
    id:       'nginx-proxy',
    template: template,

    ui: {
        list_region: '.list-region',
        add:         '.add-item',
        dimmer:      '.dimmer'
    },

    regions: {
        list_region: '@ui.list_region'
    },

    events: {
        'click @ui.add': function (e) {
            e.preventDefault();
            Controller.showNginxProxyForm();
        }
    },

    templateContext: {
        showAddButton: Cache.User.canManage('proxy_hosts')
    },

    onRender: function () {
        let view = this;

        Api.Nginx.ProxyHosts.getAll()
            .then(response => {
                if (!view.isDestroyed()) {
                    if (response && response.length) {
                        view.showChildView('list_region', new ListView({
                            collection: new ProxyHostModel.Collection(response)
                        }));
                    } else {
                        let manage = Cache.User.canManage('proxy_hosts');

                        view.showChildView('list_region', new EmptyView({
                            title:      'There are no Proxy Hosts',
                            subtitle:   manage ? 'Why don\'t you create one?' : 'And you don\'t have permission to create one.',
                            link:       manage ? 'Add Proxy Host' : null,
                            btn_color:  'success',
                            permission: 'proxy_hosts',
                            action:     function () {
                                Controller.showNginxProxyForm();
                            }
                        }));
                    }
                }
            })
            .catch(err => {
                view.showChildView('list_region', new ErrorView({
                    code:    err.code,
                    message: err.message,
                    retry:   function () {
                        Controller.showNginxProxy();
                    }
                }));

                console.error(err);
            })
            .then(() => {
                view.ui.dimmer.removeClass('active');
            });
    }
});
