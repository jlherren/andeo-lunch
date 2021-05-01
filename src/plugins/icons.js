import * as mdi from '@mdi/js';

// All icons used in the project must be declared here.  This avoids having to load a 300KB+ icon font
// when we really only use a handful icons.

const icons = {
    // Add icons here
    accountCircle: mdi.mdiAccountCircle,
    delete:        mdi.mdiDelete,
    alert:         mdi.mdiAlert,
    arrowLeft:     mdi.mdiArrowLeft,
    arrowRight:    mdi.mdiArrowRight,
    chevronLeft:   mdi.mdiChevronLeft,
    chevronRight:  mdi.mdiChevronRight,
    close:         mdi.mdiClose,
    cog:           mdi.mdiCog,
    information:   mdi.mdiInformation,
    label:         mdi.mdiLabel,
    logout:        mdi.mdiLogout,
    minus:         mdi.mdiMinus,
    plus:          mdi.mdiPlus,
    silverware:    mdi.mdiSilverware,
    cash:          mdi.mdiCash,
    home:          mdi.mdiHome,
    calendar:      mdi.mdiCalendar,
    alertCircle:   mdi.mdiAlertCircle,

    // Add semantic aliases here (this is encouraged)
    points:      mdi.mdiHandshake,
    money:       mdi.mdiCashMultiple,
    omnivorous:  mdi.mdiHamburger,
    vegetarian:  mdi.mdiFoodApple,
    optOut:      mdi.mdiCancel,
    undecided:   mdi.mdiHelpCircle,
    edit:        mdi.mdiPencil,
    event:       mdi.mdiPartyPopper,
    lunch:       mdi.mdiFoodVariant,
    missingIcon: mdi.mdiHelpCircle,
};

export default {
    install(Vue) {
        Vue.prototype.$icons = icons;
    },
};
