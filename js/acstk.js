/*!
 * ACSTK v4
 *
 */
console.log('mainjs 1234')
const ACSTK = {
    common: {
        init: function () {
            console.log('main.js - Common')
            $('body').addClass('jquery-loaded')

            // scroll top
            $("a[href='#top']").click(function() {
                $('html, body').animate({ scrollTop: 0 }, 1000 );
                return false;
            });

            /*
            Radio toggle controls
            */
            //get all the radio control Ids
            let aRadioIds = [];
            $('[data-control-radio]').each(function(){
                let radioId = $(this).attr('data-control-radio');
                aRadioIds.indexOf(radioId) === -1 ? aRadioIds.push(radioId) : '';
            });

            $.each(aRadioIds, function(i) {
                let currentRadioId = aRadioIds[i];
                let controls = $('[data-control-radio=' + currentRadioId + '][data-control]');
                let containers = $('[data-container-radio=' + currentRadioId + '][data-container]');

                $.each(controls, function(i) {
                    const containerId = $(this).attr('data-control');
                    const containerSelector = (containerId != '' )? '[data-container='+ containerId + ']' : '[data-container]';
                    const container = $(containerSelector);
                    const control = $(this);
                    $(this).on('click', function(e) {
                        e.preventDefault();
                        const state = control.attr('data-state');
                        // toggele state of this controller
                            ACSTK.fn.actStateToggleSelect(control, state);
                        // toggele state of this container
                            ACSTK.fn.actStateToggleSelect(container, state);
                        // toggle off all other container
                        containers.not(container).each(function() {
                            ACSTK.fn.actStateToggleSelect($(this), 'on');
                        });
                        // toggle off all other controllers
                        controls.not(control).each(function() {
                            ACSTK.fn.actStateToggleSelect($(this), 'on');
                        });
                    });
                });
            });

            $('[data-control]:not([data-control-radio])').each(function() {

                const containerId = $(this).attr('data-control');
                const controlSelector = (containerId != '' )? '[data-control='+ containerId + ']' : this;
                const control = $(controlSelector);
                const controlGroupId = control.attr('data-state-group');
                const containerSelector = (containerId != '' )? '[data-container='+ containerId + ']' : '[data-container]';
                const container = $(containerSelector);

                control.off('click');

                control.on('click',  function (e) {
                    console.log('clickered');
                    const state = control.attr('data-state');
                    e.preventDefault();
                    ACSTK.fn.actStateToggleSelect(control, state);

                    if (controlGroupId){
                        console.log('clickered group');
                        ACSTK.fn.actStateToggleGroup(control, controlGroupId, state);
                        ACSTK.fn.actStateToggleSelect(container, state);

                    }else{
                        console.log('clickered not group');
                        ACSTK.fn.actStateToggleSelect(container, state);
                    }
                });

            });
        }
    },
    collection: {
        init: function () {
            console.log('main.js - Collection')
        }
    },
    page: {
        init: function () {
            console.log('main.js - Page')
        }
    },
    product: {
        init: function () {
            console.log('main.js - Product')

            $('.c-product-gallery__focus-image:first-child .c-product-gallery__wrapper').removeClass('u-hidden');
            $(document).on('click', '.c-product-gallery__link--thumb', function (e) {
                e.preventDefault()

                let galleryThumb = $(this);
                let thumbId = galleryThumb.attr('data-thumbnail-id');
                let galleryImage = $('.c-product-gallery__wrapper[data-image-id=' + thumbId + ']')

                $('.c-product-gallery__wrapper').addClass('u-hidden').queue(function(next){
                    galleryImage.removeClass('u-hidden');
                    next();
                })

            })
        }

    },
    fn: {
        actStateToggleSelect : function (element, state) {
            console.log('element');
            console.log(element);
            if('off' === state ){
                element.attr('data-state', 'on');
            }
            if('on' === state){
                element.attr('data-state', 'off');
            }
        },
        actStateToggleGroup : function (control, stateGroupId, state){
            $('[data-state-group='+stateGroupId+']').not(control).each(function(){
                if ('off' === $(this).attr('data-state') ) {
                    $(this).attr('data-state', 'on');
                } else if ('on' === $(this).attr('data-state') ) {
                    $(this).attr('data-state', 'off');
                } else{
                    console.log('compfail');
                    console.log($(this).attr('data-state'));
                }
            })

        },
    }
}

UTIL = {
    exec: function(template, handle) {
        const ns = ACSTK;
        handle = (handle === undefined) ? "init" : handle;

        if (template !== '' && ns[template] && typeof ns[template][handle] === 'function') {
            ns[template][handle]();
        }
    },
    init: function() {
        const body = document.body;
        const  template = body.getAttribute('data-template');
        const  handle = body.getAttribute('data-template-type');

        UTIL.exec('common');
        UTIL.exec(template);
        UTIL.exec(template, handle);
    }
};
$(window).on('load', UTIL.init);
