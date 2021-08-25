import * as mdi from '@mdi/js';

// All icons used in the project must be declared here.  This avoids having to load a 300KB+ icon font
// when we really only use a handful icons.

export const icons = {
    // Add icons here.  Keep this list sorted!
    account:       mdi.mdiAccount,
    accountCircle: mdi.mdiAccountCircle,
    alert:         mdi.mdiAlert,
    alertCircle:   mdi.mdiAlertCircle,
    arrowLeft:     mdi.mdiArrowLeft,
    arrowRight:    mdi.mdiArrowRight,
    calendar:      mdi.mdiCalendar,
    chevronLeft:   mdi.mdiChevronLeft,
    chevronRight:  mdi.mdiChevronRight,
    clock:         mdi.mdiClock,
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

    // Add semantic aliases here (this is encouraged).  Keep this list sorted!
    appMenu:        mdi.mdiMenu,
    balanceHistory: mdi.mdiScaleBalance,
    edit:           mdi.mdiPencil,
    log:            mdi.mdiNotebook,
    lunch:          mdi.mdiFoodVariant,
    menu:           mdi.mdiSilverware,
    missingIcon:    mdi.mdiHelpCircle,
    money:          mdi.mdiCashMultiple,
    omnivorous:     mdi.mdiHamburger,
    optOut:         mdi.mdiCancel,
    password:       mdi.mdiLock,
    points:         mdi.mdiHandshake,
    special:        mdi.mdiPartyPopper,
    stats:          mdi.mdiChartBar,
    transferCustom: mdi.mdiCogs,
    transferFine:   mdi.mdiAccountAlert,
    transferIn:     mdi.mdiAccountArrowLeft,
    transferLunch:  mdi.mdiFoodVariant,
    transferOut:    mdi.mdiAccountArrowRight,
    transferPayUp:  mdi.mdiCreditCard,
    transferPot:    mdi.mdiPotMix,
    transferTrade:  mdi.mdiSwapVerticalBold,
    transfers:      mdi.mdiSwapHorizontalBold,
    undecided:      mdi.mdiHelpCircle,
    vegetarian:     mdi.mdiFoodApple,
};

export default {
    install(Vue) {
        Vue.prototype.$icons = icons;
    },
};
