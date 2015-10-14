/*!
 * STEEM PB v2.0
 *
 * Copyright 2014 steempb.com
 * Licensed under the Apache License v2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Designed and built half-drunk and mostly insane by @pettazz.
 *
 * Load javascript stuff required to build the page
 */

// Modernizr.load({
//     test: Modernizr.csstransforms3d,
//     yep : '/assets/css/experimental.css'
// }); 

//determine if this is @2x territory
var isRetina = Math.floor(window.devicePixelRatio) > 1;

var jetGuyMainPresent = true;
var jetGuyMainAnimating = false;

var jetFleetPresent = false;
var jetFleetAnimating = false;

var locations = {};
var statesMap = {
    'CT': {locations: [], displayName: 'Connecticut'},
    'MA': {locations: [], displayName: 'Massachusetts'},
    'NH': {locations: [], displayName: 'New Hampshire'},
    'NY': {locations: [], displayName: 'New York'},
    'ME': {locations: [], displayName: 'Maine'},
    'RI': {locations: [], displayName: 'Rhode Island'},
    'VT': {locations: [], displayName: 'Vermont'}
};
var map;
var openInfoWindow = null;

// TODO: hook this up to the backend to be generated by php
var productIdJar = '6c403910-6ce3-4d72-9509-9ff8302c975c'
    productIdCase = '1c329b23-4398-4734-b2d7-661fd94874f4'
    productIdValueMeal = 'a4c1b91a-1a6d-422b-848e-ad662370fa36';

var cart_context = {
    'item_name': 'None',
    'item_id': '',
    'item_quantity': 0,
    'item_subtotal': 0,
    'shipping_total': 0,
    'verified_codes': [],
    'discounts': [],
    'rejected_discounts': []
};

// get our templates
var store_template;
$.get("/assets/templates/store_front_page.handlebars", function(raw) {
    store_template = Handlebars.compile(raw);
});

var summary_template;
$.get("/assets/templates/store_summary.handlebars", function(raw) {
    summary_template = Handlebars.compile(raw);
});

var checkout_template;
$.get("/assets/templates/checkout_complete.handlebars", function(raw) {
    checkout_template = Handlebars.compile(raw);
});


$(document).ready(function(){
    enableSmoothScrollAnchors();
    jetGuyFlyIn();
    // Konami loader
    var eggloader = new Konami(function(){
        if(typeof easterEgg == "undefined"){
            // wow such default pretty
            suchDogeWow();
        }else if(typeof easterEgg == "function"){
            easterEgg();
        }else if(typeof easterEgg == "string"){
            switch(easterEgg){
                default:
                    suchDogeWow();
                    break;
            }
        }else{
            suchDogeWow();
        }
    }); 

    //make jetguys fly
    $(window).scroll(function(eData){
        // $(window).height() is bugged in mobilesafari
        var winHeight = window.innerHeight ? window.innerHeight : $(window).height();
        var currentST = $(this).scrollTop();

        if(!jetFleetPresent && jetGuyMainPresent && currentST > 200){
            jetGuyFlyAway();
        }
        if(!jetFleetPresent && currentST < 200 && !jetGuyMainPresent){
            jetGuyFlyIn();
        }
    });

    //close any popovers with an oustide click
    $('body').on('click', function (e) {
        //did not click a popover toggle or popover
        if ($(e.target).data('toggle') !== 'popover'
            && $(e.target).parents('.popover.in').length === 0) { 
            $('[data-toggle="popover"]').popover('hide');
        }
    });

    $('[data-checkout-stage="begin"]').click(function(eo){
        jetGuyFlyAway();
        $("#cta-main").children().each(function(){
            $(this).fadeOut('fast', function(){
                $(this).remove()
            });
        });
        // if($('html').hasClass('csstransforms3d')){
        //     $("#cta-main").append('<div class="spinner"></div>');
        // }else{
        //     $("#cta-main").append('<div class="gifspinner"><img src="/assets/img/template/spinner.gif" /></div>');
        // }
        jetFleetFlyIn();
        $("#cta-main").animate({
            backgroundColor: 'rgba(238, 238, 238, 0.96)'
        }, 500, 'easeInBack');
        $("#cta-main-container").animate(
            {
                marginLeft: -425,
                width: 800, 
                height: 500,
                boxShadow: 'none'
            }, 
            501,
            'easeInBack', function(){
                $("#cta-main").css({
                    backgroundColor: 'rgba(238, 238, 238, 0)',
                    transition: '0.6s',
                    boxShadow: 'none'
                });

                context = {
                    
                };

                context.flip_side = 'front';
                context.payment_method = 'usd';
                context.usd = true;
                $('#cta-main').html( store_template(context) );

                // context.flip_side = 'back';
                // context.payment_method = 'doge';
                // context.usd = false;
                // $('#cta-main').append( store_template(context) );

                // $(".dogetoggle").click(function(){
                //     flipPayment();
                // });

                $('.international-shipping-info').attr('data-content', '<p style="font-size:12px; color:#333;">For international shipping, please use our affiliate <a href="http://www.veganproteins.com/proteins-more-shop/caffeinated-peanut-butter-by-steem/?add-to-cart=11223">VeganProteins.com</a>.</p>');

                // sync the shipping form on both sides
                // $('form.shipping input').change(function(eo){
                //     $('.' + oppositeSide() + ' form.shipping input[name=' + $(this).attr('name') + ']').val($(this).val()).keyup();
                // });

                // Checkout stuff

                btn = $('select[name=inputQuantity]').parents('form').find('.checkoutbtn');
                btn.addClass('noclicky');
                btn.mouseover(function(){
                    select = $(this).parents('form').find('select[name=inputQuantity]');
                    if($(this).hasClass('noclicky')){
                        select.tooltip({
                            'animation': true,
                            'placement': 'bottom',
                            'trigger': 'manual',
                            'title': 'Please select a quantity.'
                        });
                        select.tooltip('show');
                    }else{
                        select.tooltip('destroy');
                    }
                });

                $('select[name=inputQuantity]').change(function(){
                    // $('select[name=inputQuantity]').val($(this).val());
                    $('select[name=inputQuantity]').tooltip('destroy');
                    if($(this).val()){
                        var quantity = parseInt($(this).val());
                        var usdLabel;

                        if(quantity === 12){
                            usdLabel = '$59.99 <i class="icon-play"></i>';
                        }else{
                            usdLabel = '$' + (6.75 + (4.99 * quantity)).toFixed(2) + ' <i class="icon-play"></i>';
                        }

                        var labels = {
                            // doge: 'Ð' + ((6.75 + (4.99 * quantity)) / dogeValue).toFixed(2) + ' <i class="icon-play"></i>',
                            usd: usdLabel
                        }                       

                        $('.checkoutbtn[data-payment-method="' + currentSideCurrency() + '"]').fadeOut('fast', function(){
                            $(this).removeClass('btn-disabled').removeClass('noclicky');
                            $(this).html(labels[currentSideCurrency()]);
                            $(this).fadeIn();
                            $('select[name=inputQuantity]').tooltip('destroy');
                        });

                        if($("#jar-img").hasClass("case-image")){
                            if(quantity !== 12){
                                $("#jar-img").fadeOut('fast', function(){
                                    $(this).attr('src', '/assets/img/template/checkout_jars' + (isRetina? '@2x' : '') + '.png');
                                    $(this).removeClass('case-image');
                                    $(this).fadeIn();
                                });
                                $("#jar-details").fadeOut('fast', function(){
                                    $("#jar-price").html('<strong>$4.99 </strong> <br /> Per 8oz Jar');
                                    $("#jar-shipping").html('+ $6.75 flat-rate Shipping to Contiguous US');
                                    $("#jar-description").html('Delicious peanut butter. Put it in your face and do stuff! It tastes good and I\'m writing words.');
                                    $(this).fadeIn(); 
                                });
                            }
                        }else{
                            if(quantity === 12){
                                $("#jar-img").fadeOut('fast', function(){
                                    $(this).attr('src', '/assets/img/template/checkout_case' + (isRetina? '@2x' : '') + '.png');
                                    $(this).addClass('case-image');
                                    $(this).fadeIn();
                                });
                                $("#jar-details").fadeOut('fast', function(){
                                    $("#jar-price").html('<strong>$59.99 </strong> <br /> 12 8oz Jars');
                                    $("#jar-shipping").html('+ Free flat-rate Shipping to Contiguous US');
                                    $("#jar-description").html('A whole case of delicious peanut butter. Put it in your face and do twelve times as much stuff!');
                                    $(this).fadeIn(); 
                                });
                            }
                        }

                        // $('.checkoutbtn[data-payment-method="' + oppositeSideCurrency() + '"]').html(labels[oppositeSideCurrency()]).removeClass('noclicky');

                    }else{
                        $(this).tooltip({
                            'animation': true,
                            'placement': 'bottom',
                            'trigger': 'manual',
                            'title': 'Please select a quantity.'
                        });
                        $(this).tooltip('show');

                        $('.checkoutbtn[data-payment-method="' + currentSideCurrency() + '"]').fadeOut('fast', function(){
                            $(this).addClass('btn-disabled').addClass('noclicky');
                            $(this).html('Buy Me');
                            $(this).fadeIn();
                        });
                        // $('.checkoutbtn[data-payment-method="' + oppositeSideCurrency() + '"]').html('Buy Me').addClass('noclicky');
                        
                    }
                });

                $('form.checkout-normal').submit(function(eo){
                    eo.preventDefault();
                    if($(this).find('.checkoutbtn').hasClass('noclicky')){
                        eo.preventDefault();
                        select = $(this).find('select[name=inputQuantity]');
                        select.tooltip({
                            'animation': true,
                            'placement': 'bottom',
                            'trigger': 'manual',
                            'title': 'Please select a quantity.'
                        });
                        select.tooltip('show');
                    }else{
                        if(
                            (cart_context.item_id != productIdJar) ||
                            ($(this).find('select[name=inputQuantity]').val() != cart_context.item_quantity)
                        ){
                            resetPromos();
                        }

                        var item_quantity = $(this).find('select[name=inputQuantity]').val();
                        if(item_quantity === '12'){
                            cart_context.item_id = productIdCase;
                            cart_context.item_name = 'STEEM Case';
                            cart_context.item_quantity = 1;
                            cart_context.item_subtotal = 59.99;
                            cart_context.shipping_total = 0;
                        }else{
                            cart_context.item_id = productIdJar;
                            cart_context.item_name = 'STEEM Jar';
                            cart_context.item_quantity = item_quantity;
                            cart_context.item_subtotal = cart_context.item_quantity * 4.99;
                            cart_context.shipping_total = 6.75;
                        }
                        checkoutSlide(2);
                    }
                });

                // Special stuff

                $('select[name=inputColor]').change(function(){
                    $('.' + oppositeSide() + ' select[name=inputColor]').val($(this).val());
                    var that = $(this);
                    $('.img-special').fadeOut(function(){
                        $(this).attr('src', '/assets/img/template/checkout_valuemeal_' + that.val() + (isRetina? '@2x' : '') + '.png');
                        $(this).fadeIn();
                    });
                    checkShirtAvailability();
                });

                $('select[name=inputSize]').change(function(){
                    $('.' + oppositeSide() + ' select[name=inputSize]').val($(this).val());
                    checkShirtAvailability();
                });

                $('form.checkout-special').submit(function(eo){
                    eo.preventDefault();
                    checkShirtAvailability();
                    if($(this).find('.steembtn').hasClass('noclicky')){
                        return false;
                    }

                    if(cart_context.item_id != productIdValueMeal){
                        resetPromos();
                    }
                    cart_context.item_id = productIdValueMeal;
                    cart_context.item_name = '2 Jars + T-Shirt';
                    cart_context.item_quantity = 1;
                    cart_context.item_subtotal = 19.99;
                    cart_context.shipping_total = 0;
                    checkoutSlide(2);
                });

                // step 2 

                $('select[name=inputState]').change(function(){
                    $(this).find("option:selected").text($(this).val());
                });
                $('.confirm-checkout-btn').click(function(eo){
                    performCheckout();
                });
            }
        );
    });

});

function checkShirtAvailability(){
    var selectedSize = $('select[name=inputSize]').val();
    var selectedColor = $('select[name=inputColor]').val();

    if(!shirtAvailability[selectedColor] || !shirtAvailability[selectedColor][selectedSize]){
        $('form.checkout-special').find('.steembtn').addClass('noclicky');
        $('select[name=inputSize]').tooltip({
            'animation': true,
            'placement': 'bottom',
            'trigger': 'manual',
            'title': 'This color is currently unavailable at this size. Please select another.'
        });
        $('select[name=inputSize]').tooltip('show');
    }else{
        $('form.checkout-special').find('.steembtn').removeClass('noclicky');
        $('select[name=inputSize]').tooltip('destroy');
    }
}

function currentSide(){
    return 'front';
    // return ($("#cta-main-container").hasClass('flip'))
    //     ? 'back'
    //     : 'front';
}

function oppositeSide(){
    return ($("#cta-main-container").hasClass('flip'))
        ? 'front'
        : 'back';
}

function currentSideCurrency(){
    return 'usd';
    // return ($("#cta-main-container").hasClass('flip'))
    //     ? 'doge'
    //     : 'usd';
}

function oppositeSideCurrency(){
    return ($("#cta-main-container").hasClass('flip'))
        ? 'usd'
        : 'doge';
}

function stringifyDiscounts(){
    var result = '';
    for(var i = 0; i < cart_context.discounts.length; i++){
        var disc = cart_context.discounts[i];
        if(disc.single_use != '1'){
            for(var iter = 0; iter < cart_context.item_quantity; iter++){
                result += disc.code + ",";
            }
        }else{
            result += disc.code + ",";
        }
    }

    return result.replace(/,+$/, "");
}

function flipPayment(){
    $("#cta-main-container").toggleClass('flip');

    // IE just doesn't understand me and my needs
    if(!$('html').hasClass('csstransforms3d')){
        $('.' + oppositeSide()).fadeOut();
        $('.' + currentSide()).fadeIn();
    }
}

function checkoutSlide(slide){
    var margins = [
        -20, -20, -20
    ];
    if(slide == 3){
        $('.btn.dogetoggle').fadeOut('fast');
        margins[0] = -1808;
        margins[1] = -914;
    }else if(slide == 2){
        $('.btn.dogetoggle').fadeIn('fast');
        updateSummary();
        margins[0] = -914;
    }else{
        $('.btn.dogetoggle').fadeIn('fast');
    }
    for(var i = 0; i <= margins.length; i++){
        $('.store-slide[data-store-slide=' + (i + 1) + ']').animate({
            marginLeft: margins[i]
        }, 300);
    }
    wizardTransition(slide);
}

function wizardTransition(targetNum){
    currentNum = $('.bs-wizard-step.active').attr('data-bs-wizard-step');

    current = $('.bs-wizard-step[data-bs-wizard-step=' + currentNum + ']');
    target = $('.bs-wizard-step[data-bs-wizard-step=' + targetNum + ']');

    if(targetNum < currentNum){
        current.addClass('disabled');
        current.removeClass('active');
        setTimeout(function(){
            target.removeClass('complete');
            target.addClass('active');
        }, 100);
    }else if(targetNum > currentNum){
        current.addClass('complete');
        current.removeClass('active');
        setTimeout(function(){
            target.addClass('active');
            setTimeout(function(){
                target.removeClass('disabled');
            }, 100);
        }, 100);
    }else{
        //nothin
    }
}

function updateSummary(){
    var discount_total = 0;
    for(var i = 0; i < cart_context.discounts.length; i++){
        if(cart_context.discounts[i].single_use == "0"){
            discount_total += cart_context.discounts[i].value * cart_context.item_quantity;
        }else{
            discount_total += cart_context.discounts[i].value;
        }
    }
    cart_context.total = cart_context.item_subtotal + cart_context.shipping_total - discount_total;

    context_front = cart_context;
    context_front.usd = true;
    $('.store-side.front dl.store-summary').html( summary_template(context_front) );

    context_back = cart_context;
    context_back.usd = false;
    $('.store-side.back dl.store-summary').html( summary_template(context_back) );

    $('.cart-edit-link').click(function(){
        checkoutSlide(1);
    });

    $('.btn.promo-codes').click(function(){
        collectPromoCode($(this));
    });
}

function collectPromoCode(that){
    that.parent('dd').siblings('dt.promo-placeholder').replaceWith('<input type="text" id="promo-code-input" /> <button id="promo-code-submit" class="btn btn-small btn-warning ladda-button" data-style="slide-left" data-size="xs"><span class="ladda-label">Add</span></button>');
    that.parent('dd').remove();
    $("#promo-code-input").keypress(function(eo){
        if(eo.which == 13){
            $("#promo-code-submit").click();
        }
    });
    $("#promo-code-input").focus();
    $("#promo-code-submit").click(function(eo){
        eo.preventDefault();

        var btn = $("#promo-code-submit").ladda();
        btn.ladda('start');
        $("#promo-code-input").attr('disabled', true);

        if(cart_context.item_id === productIdValueMeal || cart_context.item_id === productIdCase){
            cart_context.rejected_discounts = [{
                'code': '',
                'reason': 'Promo Codes not accepted on this item.'
            }];
            updateSummary();
        }else{
            $.post('/ticketCheck.php', {
                'tickets': $("#promo-code-input").val()
            }, function(data){
                for(var i = 0; i < data.valid.length; i++){
                    if($.inArray(data.valid[i].code, cart_context.verified_codes) === -1){
                        cart_context.verified_codes.push(data.valid[i].code);
                        cart_context.discounts = $.merge([data.valid[i]], cart_context.discounts);
                    }
                }
                cart_context.rejected_discounts = data.invalid;
            })
            .fail(function(){
                cart_context.rejected_discounts = {'code': $("#promo-code-input").val()};
            })
            .always(function(){
                updateSummary();
            });
        }
    });

}

function resetPromos(){
    cart_context.verified_codes = [];
    cart_context.discounts = [];
    cart_context.rejected_discounts = [];
}

function collectShipping(){
    var valid = true;
    var data = {};
    $('.' + currentSide() + ' form.shipping input,select').each(function(){
        var field = $(this).attr('data-field-name');
        if(field === 'line2'){
            // dont validate line2
            valid = valid && true;
            data[field] = $.trim($(this).val());
        }else if(field === 'type'){
            // get only the checked radio value, dont validate
            valid = valid && true;
            if($(this).prop('checked')){
                data[field] = $(this).val();
            }
        }else{
            var value = $.trim($(this).val());
            if(!value || value === ''){
                $(this).focus();

                $(this).tooltip({
                    'animation': true,
                    'placement': 'right',
                    'trigger': 'manual',
                    'title': 'This field is required.'
                });
                $(this).tooltip('show');

                $(this).keyup(function(){
                    $(this).tooltip('destroy');
                });

                $(this).blur(function(){
                    $(this).tooltip('destroy');
                });

                valid = false;
                return false;
            }else if(field === 'state' && (value.toLowerCase() === 'ak' || value.toLowerCase() === 'hi')){
                $(this).focus();

                $(this).tooltip({
                    'animation': true,
                    'placement': 'right',
                    'trigger': 'manual',
                    'title': 'Our apologies, but we are only able to offer shipping to the Continugous US at this time.'
                });
                $(this).tooltip('show');

                $(this).keyup(function(){
                    $(this).tooltip('destroy');
                });

                $(this).blur(function(){
                    $(this).tooltip('destroy');
                });

                valid = false;
                return false;
            }else{
                valid = valid && true;
                data[field] = value;
            }
        }
    });

    return (valid)
        ? data
        : false;

}

function performCheckout(){
    var shipping = collectShipping();
    if(!shipping){
        checkoutSlide(2)
        return false;
    }

    var checkoutPostData = {
        'product': cart_context.item_id,
        'quantity': cart_context.item_quantity,
        'payment': (currentSideCurrency() == 'usd')? 'PAYPAL' : 'DOGE', 
        'tickets': stringifyDiscounts(),
        'email': shipping.email,
        'recipient_name': shipping.recipient_name,
        'type': shipping.type,
        'line1': shipping.line1,
        'line2': shipping.line2,
        'city': shipping.city,
        'state': shipping.state,
        'postal_code': shipping.postal_code
    }

    if(cart_context.item_id == productIdValueMeal){
        //value meal has dimensions
        checkoutPostData['size'] = $('.' + currentSide() + ' form.checkout-special select[name=inputSize]').val();
        checkoutPostData['color'] = $('.' + currentSide() + ' form.checkout-special select[name=inputColor]').val();
    }

    $('.checkout-status').html(checkout_template( {} ));
    checkoutMessageRotate();
    checkoutSlide(3);
    jetFleetFlyAway(function(){
        $.post('/checkout.php', checkoutPostData, function(data){
            if(typeof data.url === "undefined"){
                checkoutError({
                    'error': {
                        'code': 'invalid_redirect',
                        'message': 'Unable to create sale with ' + ((currentSideCurrency() == 'usd')? 'PayPal' : 'Moolah')
                    }
                });
            }else{
                window.location.href = data.url;
            }
        })
        .fail(function(jqXHR){
            checkoutError(jqXHR.responseJSON);
        });
    });
}

function randRange(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkoutMessageRotate(){
    $('p.checkoutlols').html(
        checkout_lol_messages[randRange(0, checkout_lol_messages.length)]
    );
    setTimeout(function(){
        checkoutMessageRotate();
    }, randRange(5, 10) * 100);
}

function checkoutError(errData){
    var context = {
        'error': true,
        'error_json': JSON.stringify(errData),
        'error_message': errData.error.message,
        'back_button': false,
        'retry_button': false
    };

    if(errData.error.code == 'generic_error'){
        context.error_message = '';
        context.retry_button = true;
    }

    if(errData.error.code == 'invalid_redirect'){
        context.error_message = 'We had a problem communicating with ' + ((currentSideCurrency() == 'usd')? 'PayPal.' : 'Moolah.');
        context.retry_button = true;
    }

    if(errData.error.code == 'ticket_quantity_mismatch'){
        context.error_message = 'There were more tickets added to your order than items.';
        context.back_button = true;
    }

    if(errData.error.code == 'invalid_product'){
        context.error_message = 'The product you selected is no longer available.';
        context.back_button = true;
    }

    if(errData.error.code == 'invalid_payment_method'){
        context.error_message = 'We only accept payments in USD via PayPal and Dogecoin via Moolah.';
        context.back_button = true;
    }

    $('.checkout-status').html(checkout_template(context));

    $('.btn-checkout-back').click(function(){
        checkoutSlide(2);
    });

    $('.btn-checkout-retry').click(function(){
        performCheckout();
    });
}

function jetGuyHover(){
    $('#jetguy-main').animate({
            top: 240
        }, 1000, 'easeOutBack', function(){
            $('#jetguy-main').animate({
                top: 250
            }, 1000, 'easeInBack');
    });
}

function jetGuyFlyAway(){
    if(!jetGuyMainAnimating){
        jetGuyMainAnimating = true;
        $('#jetguy-main').animate({
            top: -572,
            left: '90%'
        }, 1000, 'easeInQuart', function(){
            jetGuyMainPresent = false;
            jetGuyMainAnimating = false;
        });
    }
}

function jetGuyFlyIn(){
    if(!jetGuyMainAnimating){
        jetGuyMainAnimating = true;
        $('#jetguy-main').css({
            top: 900,
            left: '20%'
        });
        $('#jetguy-main').animate({
            top: 250,
            left: '50%'
        }, 1000, function(){
            jetGuyMainPresent = true;
            jetGuyMainAnimating = false;
        });
    }
}

function jetFleetFlyIn(){
    if(!jetFleetAnimating){
        jetFleetAnimating = true;
        $('#jet-fleet .jetguy').each(function(){
            var currentCSSOffset = $(this).css(['top', 'left']);
            $(this).css({
                top: "+=" + ($(this).height() + 50),
                left: "-=100",
                visibility: 'visible'
            });
            $(this).animate(currentCSSOffset, 1500, function(){
                jetFleetPresent = true;
                jetFleetAnimating = false;
            });
        });
    }
}

function jetFleetFlyAway(callback){
    if(!jetFleetAnimating){
        jetFleetAnimating = true;
        var iter = 0;
        var guys = $('#jet-fleet .jetguy').length;
        $('#jet-fleet .jetguy').each(function(index, value){
            var that = $(this);
            window.setTimeout(function(){
                var currentCSSOffset = that.css(['top', 'left']);
                that.animate({
                    top: -1 * (that.height() + 100),
                    left: "+=300"
                }, 1500, 'easeInQuart', function(){
                    that.css('visibility', 'hidden');
                    that.css(currentCSSOffset);
                    if(index + 1 == guys){
                        jetFleetAnimating = false;
                        if(typeof callback === 'function'){
                            callback();
                        }
                    }
                });
            }, iter * 300);
            iter++;
        });
    }
}

function suchDogeWow(){
    if(typeof LIBDOGE == "undefined"){
        yepnope.injectJs('/assets/js/libdoge.min.js', function(){
            LIBDOGE.controller.buyDoge();
        });
    }else{
        LIBDOGE.controller.buyDoge();
    }
}

function enableSmoothScrollAnchors(elements){
    if(typeof elements === 'undefined'){
        elements = 'a[href*=#]:not([href=#])';
    }
    $(elements).click(function() {
        if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
            if (target.length) {
                $('html,body').animate({
                    scrollTop: target.offset().top - 60
                }, 1000, function(){
                    $(window).scroll();
                });
                return false;
            }
        }
    });
}


// load one of our Handlebars templates
function loadTemplate(name, callback){
    $.get("/assets/templates/"+ name + ".handlebars", function(raw) {
        callback(Handlebars.compile(raw));
    });
}

/*
 * Retina Images using Handlebars.js
 *
 * Created by [Makis Tracend](@tracend)
 * Released under the [MIT license](http://makesites.org/licenses/MIT) 
 *
 * Usage: <img src="{{retina 'http://mydoma.in/path/to/image.jpg'}}">
 */
Handlebars.registerHelper('retina', function( src ) {

    return (isRetina) 
        ? src.replace(/\.\w+$/, function(match) { return "@2x" + match; }) 
        : src;
  
});

// change prices to DOGE
Handlebars.registerHelper('formatPrice', function( value ) {
    return (this.usd)
        ? '$' + parseFloat(value).toFixed(2)
        : 'Ð' + (parseFloat(value) / dogeValue).toFixed(2);
  
});

// helper to print discounts because context scope with #each uggggh
Handlebars.registerHelper('formatDiscounts', function( discounts ) {
    var output = '';
    for(var i = discounts.length - 1; i > -1; i--){
        var value = discounts[i].value;
        output += '<dt class="discount">' + discounts[i].promo_name;
        if(discounts[i].single_use == "1"){
            output += '</dt>';
        }else{
            output += ' (' + this.item_quantity + ')</dt>';
            value *= this.item_quantity;
        }
        output += '<dd class="discount">- ';
        output += (this.usd)
            ? '$' + parseFloat(value).toFixed(2)
            : 'Ð' + (parseFloat(value) / dogeValue).toFixed(2);
        output += '</dd>';
    }
    return new Handlebars.SafeString(output);
});

// return the payment service name
Handlebars.registerHelper('checkoutService', function() {
    return (this.usd)
        ? 'PayPal'
        : 'Moolah';
  
});

// show a spinner based on browser capabilities
Handlebars.registerHelper('bigSpinner', function() {
    var result = ($('html').hasClass('csstransforms3d'))
        ? '<div class="spinner"></div>'
        : '<div class="gifspinner"><img src="/assets/img/template/spinner.gif" /></div>';

    return new Handlebars.SafeString(result);
});

function initMap() {

    $("#mapList").html(($('html').hasClass('csstransforms3d'))
        ? '<div class="spinner"></div>'
        : '<div class="gifspinner"><img src="/assets/img/template/spinner.gif" /></div>')
    .append('<p class="loading">Loading locations...</p>');

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: {
            lat: 42.7673195,
            lng: -71.81229139999999
        }
    });

    var promises = [];

    $.each(retailAddresses, function(idx, val){
        locations[val['uuid']] = {'data': val};

        if(val['latlng']){
            var latlng = JSON.parse(val['latlng']);
            generateLocationObject(map, val, {lat: latlng[0], lng: latlng[1]});
        }else{
            promises.push($.get('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyBuCF3E0r4UZd9aO9eDjJCxtaryNlktL7M&address=' + val['searchAddress'])
                .done(function(data){
                    if(data.status && data.status === 'OK'){
                        generateLocationObject(map, val, data.results[0].geometry.location);
                    }else{
                        console.warn('unable to geolocate location with uuid ' + val['uuid'] + ': [' + data.status + '] ' + data.error_message);
                        // TODO: Show it on the list without a map marker somehow
                    }
            }));
        }
    });

    if(promises.length > 0){
        $.when.apply($, promises).then(displayMapList);
    }else{
        displayMapList();
    }
};

function generateLocationObject(map, retailAddress, latlng){
    var contentString = '<div id="content">'+
      '<div id="siteNotice">'+
      '</div>'+
      '<h3 id="firstHeading" class="firstHeading">' + retailAddress['name'] + '</h3>'+
      '<div id="bodyContent">'+
      '<p><address>'+
      retailAddress['address'] + '<br />'+
      retailAddress['city'] + ', ' + retailAddress['state'] + ' ' + retailAddress['zip code'] + '<br />'+
      '</address></p>'+
      (retailAddress['phone number']? '<p><a href="tel:' + retailAddress['phone number'].replace(/["'()\- ]/g,"") + '">' + retailAddress['phone number'] + '</a></p>' : '')+
      (retailAddress['website']? '<p><a href="http://' + retailAddress['website'] + '" target="_blank">' + retailAddress['website'] + '</a></p>' : '')+
      '</div>'+
      '</div>';
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    locations[retailAddress['uuid']]['infoWindow'] = infowindow;

    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: retailAddress['name']
    });
    locations[retailAddress['uuid']]['marker'] = marker;
    marker.addListener('click', function() {
        if(openInfoWindow){
            openInfoWindow.close();
            openInfoWindow = null;
        }
        infowindow.open(map, marker);
        openInfoWindow = infowindow;
    });

    statesMap[retailAddress['state'].toUpperCase()]['locations'].push(retailAddress['uuid']);
}

function displayMapList(){
    var stateLists = [];
    $.each(statesMap, function(idx, val){
        if(val.locations.length > 0){
            var stateListEl = $('<div class="span5"><h3>' + val.displayName + '</h3></div>');
            $.each(val.locations, function(idx, val){
                locationData = locations[val];
                locationEl = $('<p><a href="#map" class="mapLink" data-location-id="' + val + '"><strong>' + locationData.data.name + '</strong><br />' + locationData.data.city + '</a></p>');
                stateListEl.append(locationEl);
            });
            stateLists.push(stateListEl);
        }
    });

    $('#mapList').html(stateLists);
    
    $('a.mapLink').click(function(){
        if(openInfoWindow){
            openInfoWindow.close();
            openInfoWindow = null;
        }
        details = locations[$(this).data('location-id')];
        details.infoWindow.open(map, details.marker);
        openInfoWindow = details.infoWindow;
    });
    enableSmoothScrollAnchors('#mapList .mapLink');
};