import * as mdi from '@mdi/js';

// All icons used in the project must be declared here.  This avoids having to load a 300KB+ icon font
// when we really only use a handful icons.

export const icons = {
    // Add icons here.  Keep this list sorted!
    account:                mdi.mdiAccount,
    accountCircle:          mdi.mdiAccountCircle,
    alert:                  mdi.mdiAlert,
    alertCircle:            mdi.mdiAlertCircle,
    arrowLeft:              mdi.mdiArrowLeft,
    arrowRight:             mdi.mdiArrowRight,
    calendar:               mdi.mdiCalendar,
    checkboxMultipleMarked: mdi.mdiCheckboxMultipleMarked,
    chevronLeft:            mdi.mdiChevronLeft,
    chevronRight:           mdi.mdiChevronRight,
    clock:                  mdi.mdiClock,
    close:                  mdi.mdiClose,
    delete:                 mdi.mdiDelete,
    grid:                   mdi.mdiGrid,
    home:                   mdi.mdiHome,
    information:            mdi.mdiInformation,
    label:                  mdi.mdiLabel,
    logout:                 mdi.mdiLogout,
    minus:                  mdi.mdiMinus,
    plus:                   mdi.mdiPlus,
    refresh:                mdi.mdiRefresh,
    suggest:                mdi.mdiMagicStaff,

    // Add semantic aliases here (this is encouraged).  Keep this list sorted!
    absence:        mdi.mdiBeach,
    admin:          mdi.mdiCog,
    appMenu:        mdi.mdiMenu,
    balanceHistory: mdi.mdiScaleBalance,
    darkMode:       mdi.mdiThemeLightDark,
    edit:           mdi.mdiPencil,
    groceryList:    mdi.mdiCart,
    help:           mdi.mdiHelpCircle,
    log:            mdi.mdiNotebook,
    lunch:          mdi.mdiFoodVariant,
    menu:           mdi.mdiSilverware,
    missingIcon:    mdi.mdiHelpCircle,
    money:          mdi.mdiCashMultiple,
    omnivorous:     mdi.mdiHamburger,
    optIn:          mdi.mdiCheckBold,
    optOut:         mdi.mdiCancel,
    password:       mdi.mdiLock,
    points:         mdi.mdiHandshake,
    preferences:    mdi.mdiTune,
    special:        mdi.mdiPartyPopper,
    stats:          mdi.mdiChartBar,
    sus:            'm16 6c2 0 4 2 4 4s-2 4-4 4c0 0 2-2 2-4s-2-4-2-4zm-9 3v9c-1 0-2-1-2-2v-5c0-1 1-2 2-2zm5-1c-.5 0-1 .5-1 1v2c0 .5 0 1 1 1h4c1 0 2-1 2-2s-1-2-2-2zm-4 12 0-12c0-3 2-5 5-5s5 2 5 5v12c0 1-1 2-2 2-1 0-2-1-2-2v-2h-2v2c0 1-1 2-2 2-1 0-2-1-2-2z',
    tools:          mdi.mdiTools,
    transferCustom: mdi.mdiCogs,
    transferIn:     mdi.mdiAccountArrowLeft,
    transferLunch:  mdi.mdiFoodVariant,
    transferOut:    mdi.mdiAccountArrowRight,
    transferPayUp:  mdi.mdiCreditCard,
    transferPot:    mdi.mdiPotMix,
    transferTrade:  mdi.mdiSwapVerticalBold,
    transfers:      mdi.mdiSwapHorizontalBold,
    undecided:      mdi.mdiHelpCircle,
    update:         mdi.mdiCellphoneArrowDown,
    vegetarian:     mdi.mdiFoodApple,
};

export default {
    install(Vue) {
        Vue.prototype.$icons = icons;
    },
};
