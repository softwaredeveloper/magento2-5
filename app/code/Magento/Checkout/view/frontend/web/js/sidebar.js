/**
 * Copyright © 2015 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
/*jshint browser:true jquery:true*/
/*global confirm:true*/
define([
    "jquery",
    'Magento_Checkout/js/model/cart/authentication-popup',
    'Magento_Customer/js/customer-data',
    "jquery/ui",
    "mage/decorate"
], function($, authenticationPopup, customerData){

    $.widget('mage.sidebar', {
        options: {
            isRecursive: true,
            maxItemsVisible: 3
        },
        scrollHeight: 0,

        _create: function() {
            this._initContent();
        },

        _initContent: function() {
            var self = this;

            this.element.decorate('list', this.options.isRecursive);

            $(this.options.button.close).click(function(event) {
                event.stopPropagation();
                $(self.options.targetElement).dropdownDialog("close");
            });

            $(this.options.button.checkout).on('click', $.proxy(function() {
                var cart = customerData.get('cart'),
                    customer = customerData.get('customer');

                if (customer() == false && !cart().isGuestCheckoutAllowed) {
                    authenticationPopup.showModal();
                    return false;
                }
                location.href = this.options.url.checkout;
            }, this));

            $(this.options.button.remove).click(function(event) {
                event.stopPropagation();
                if (confirm(self.options.confirmMessage)) {
                    self._removeItem($(this));
                }
            });

            $(this.options.item.qty).keyup(function() {
                self._showItemButton($(this));
            });
            $(this.options.item.button).click(function(event) {
                event.stopPropagation();
                self._updateItemQty($(this))
            });

            this._calcHeight();
            this._isOverflowed();
        },

        /**
         * Add 'overflowed' class to minicart items wrapper element
         *
         * @private
         */
        _isOverflowed: function() {
            var list = $(this.options.minicart.list),
                cssOverflowClass = 'overflowed';

            if (this.scrollHeight > list.innerHeight()) {
                list.parent().addClass(cssOverflowClass);
            } else {
                list.parent().removeClass(cssOverflowClass);
            }
        },

        _showItemButton: function(elem) {
            var itemId = elem.data('cart-item');
            var itemQty = elem.data('item-qty');
            if (this._isValidQty(itemQty, elem.val())) {
                $('#update-cart-item-' + itemId).show('fade', 300);
            } else if (elem.val() == 0) {
                elem.val(itemQty);
                this._hideItemButton(elem);
            } else {
                this._hideItemButton(elem);
            }
        },

        /**
         * @param origin - origin qty. 'data-item-qty' attribute.
         * @param changed - new qty.
         * @returns {boolean}
         * @private
         */
        _isValidQty: function(origin, changed) {
            return (origin != changed)
                && (changed.length > 0)
                && (changed - 0 == changed)
                && (changed - 0 > 0);
        },

        _hideItemButton: function(elem) {
            var itemId = elem.data('cart-item');
            $('#update-cart-item-' + itemId).hide('fade', 300);
        },

        _updateItemQty: function(elem) {
            var itemId = elem.data('cart-item');
            this._ajax(this.options.url.update, {
                item_id: itemId,
                item_qty: $('#cart-item-' + itemId + '-qty').val()
            }, elem, this._updateItemQtyAfter);
        },

        /**
         * Update content after update qty
         *
         * @param elem
         * @param response
         * @private
         */
        _updateItemQtyAfter: function(elem, response) {
            this._hideItemButton(elem);
        },

        _removeItem: function(elem) {
            var itemId = elem.data('cart-item');
            this._ajax(this.options.url.remove, {
                item_id: itemId
            }, elem, this._removeItemAfter);
        },

        /**
         * Update content after item remove
         *
         * @param elem
         * @param response
         * @private
         */
        _removeItemAfter: function(elem, response) {
        },
        /**
         * @param url - ajax url
         * @param data - post data for ajax call
         * @param elem - element that initiated the event
         * @param callback - callback method to execute after AJAX success
         */
        _ajax: function(url, data, elem, callback) {
            $.ajax({
                url: url,
                data: data,
                type: 'post',
                dataType: 'json',
                context: this,
                beforeSend: function() {
                    elem.attr('disabled', 'disabled');
                },
                complete: function() {
                    elem.attr('disabled', null);
                }
            })
                .done(function(response) {
                    if (response.success) {
                        callback.call(this, elem, response);
                    } else {
                        var msg = response.error_message;
                        if (msg) {
                            window.alert($.mage.__(msg));
                        }
                    }
                })
                .fail(function(error) {
                    console.log(JSON.stringify(error));
                });
        },
        /**
         * Calculate height of minicart list
         *
         * @private
         */
        _calcHeight: function() {
            var self = this,
                height = 0,
                counter = this.options.maxItemsVisible,
                target = $(this.options.minicart.list)
                    .clone()
                    .attr('style', 'position: absolute !important; top: -10000 !important;')
                    .appendTo('body');

            this.scrollHeight = 0;
            target.children().each(function() {
                if (counter-- > 0) {
                    height += $(this).height();
                }
                self.scrollHeight += $(this).height();
            });

            target.remove();

            $(this.options.minicart.list).css('height', height);
        }
    });

    return $.mage.sidebar;
});
