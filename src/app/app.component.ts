import { Component, ViewChild } from '@angular/core';
import { Events, MenuController, Nav, Platform } from 'ionic-angular';
import {Deploy} from '@ionic/cloud-angular';
import { Storage } from '@ionic/storage';
import { Splashscreen, StatusBar } from 'ionic-native';

// import { AccountPage } from '../pages/account/account';
// import { LoginPage } from '../pages/login/login';
import { QRPage } from '../pages/qr/qr';
// import { SignupPage } from '../pages/signup/signup';
import { TabsPage } from '../pages/tabs/tabs';
import { TutorialPage } from '../pages/tutorial/tutorial';

// Conference and user specific data.
import { ConferenceData } from '../providers/conference-data';
import { UserData } from '../providers/user-data';

export interface PageObj {
  title: string;
  component: any;
  icon: string;
  index?: number;
}

@Component({
  templateUrl: 'app.template.html'
})
export class ConferenceApp {
  // the root nav is a child of the root app component
  // @ViewChild(Nav) gets a reference to the app's root nav
  @ViewChild(Nav) nav: Nav;

  // List of pages that can be navigated to from the left menu
  // the left menu only works after login
  // the login page disables the left menu
  appPages: PageObj[] = [
    { title: 'Schedule', component: TabsPage, icon: 'calendar' },
    { title: 'Speakers', component: TabsPage, index: 1, icon: 'contacts' },
    { title: 'Map', component: TabsPage, index: 2, icon: 'map' },
    { title: 'About', component: TabsPage, index: 3, icon: 'information-circle' },
    { title: 'QR', component: QRPage, index: 4, icon: 'qr-scanner' }
  ];
  rootPage: any = TabsPage;
  local: Storage;

  constructor(
    public events: Events,
    public userData: UserData,
    public menu: MenuController,
    platform: Platform,
    confData: ConferenceData,
    public storage: Storage,
    public deploy: Deploy
  ) {

    // Call any initial plugins when ready
    platform.ready().then(() => {
      this.storage.get('intro').then((local) => {
        if (!local) {
          this.nav.setRoot(TutorialPage)
        }
      })
      StatusBar.styleDefault();
      this.deploy.check().then((snapshotAvailable: boolean) => {
        if (snapshotAvailable) {
          this.deploy.download().then(() => {
            return this.deploy.extract();
          }).then(() => {
            this.deploy.load();
          });
        }
      });
      Splashscreen.hide();
    });

    // load the conference data
    confData.load();

    // decide which menu items should be hidden by current login status stored in local storage
    this.userData.hasLoggedIn().then((hasLoggedIn) => {
      this.enableMenu(hasLoggedIn === 'true');
    });

    this.listenToLoginEvents();
  }

  openPage(page: PageObj) {
    // the nav component was found using @ViewChild(Nav)
    // reset the nav to remove previous pages and only have this page
    // we wouldn't want the back button to show in this scenario
    if (page.index) {
      this.nav.setRoot(page.component, { tabIndex: page.index });
    } else {
      this.nav.setRoot(page.component);
    }

    if (page.title === 'Logout') {
      // Give the menu time to close before changing to logged out
      setTimeout(() => {
        this.userData.logout();
      }, 1000);
    }
  }

  listenToLoginEvents() {
    this.events.subscribe('user:login', () => {
      this.enableMenu(true);
    });

    this.events.subscribe('user:signup', () => {
      this.enableMenu(true);
    });

    this.events.subscribe('user:logout', () => {
      this.enableMenu(false);
    });
  }

  enableMenu(loggedIn) {
    this.menu.enable(loggedIn, 'loggedInMenu');
    this.menu.enable(!loggedIn, 'loggedOutMenu');
  }
}
