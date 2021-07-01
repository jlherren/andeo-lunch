import * as mdi from '@mdi/js';

// All icons used in the project must be declared here.  This avoids having to load a 300KB+ icon font
// when we really only use a handful icons.

export const icons = {
    // Add icons here
    accountCircle: mdi.mdiAccountCircle,
    alert:         mdi.mdiAlert,
    alertCircle:   mdi.mdiAlertCircle,
    arrowLeft:     mdi.mdiArrowLeft,
    arrowRight:    mdi.mdiArrowRight,
    calendar:      mdi.mdiCalendar,
    cash:          mdi.mdiCash,
    chevronLeft:   mdi.mdiChevronLeft,
    chevronRight:  mdi.mdiChevronRight,
    close:         mdi.mdiClose,
    cog:           mdi.mdiCog,
    delete:        mdi.mdiDelete,
    home:          mdi.mdiHome,
    information:   mdi.mdiInformation,
    label:         mdi.mdiLabel,
    logout:        mdi.mdiLogout,
    minus:         mdi.mdiMinus,
    plus:          mdi.mdiPlus,
    refresh:       mdi.mdiRefresh,

    // Add semantic aliases here (this is encouraged)
    balanceHistory: mdi.mdiScaleBalance,
    edit:           mdi.mdiPencil,
    event:          mdi.mdiPartyPopper,
    log:            mdi.mdiNotebook,
    lunch:          mdi.mdiFoodVariant,
    menu:           mdi.mdiSilverware,
    missingIcon:    mdi.mdiHelpCircle,
    money:          mdi.mdiCashMultiple,
    omnivorous:     mdi.mdiHamburger,
    optOut:         mdi.mdiCancel,
    points:         mdi.mdiHandshake,
    transfer:       mdi.mdiSwapHorizontalBold,
    undecided:      mdi.mdiHelpCircle,
    vegetarian:     mdi.mdiFoodApple,
};

export default {
    install(Vue) {
        Vue.prototype.$icons = icons;
    },
};
