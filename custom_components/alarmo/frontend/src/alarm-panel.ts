import { LitElement, html, CSSResultGroup, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { loadHaForm } from './load-ha-elements';

import './views/general/view-general.ts';
import './views/sensors/view-sensors.ts';
import './views/codes/view-codes.ts';
import './views/actions/view-actions.ts';

import { commonStyle } from './styles';
import { VERSION } from './const';
import { fetchUsers } from './data/websockets';
import { AlarmoUser, Dictionary, HomeAssistant } from './types';
import { localize } from '../localize/localize';
import { exportPath, getPath, Path } from './common/navigation';
import { navigate } from './helpers';

@customElement('alarm-panel')
export class MyAlarmPanel extends LitElement {
  @property() public hass!: HomeAssistant;
  @property({ type: Boolean, reflect: true }) public narrow!: boolean;

  @property() userConfig?: Dictionary<AlarmoUser>;

  async firstUpdated() {
    window.addEventListener('location-changed', () => {
      if (!window.location.pathname.includes('alarmo')) return;
      this.requestUpdate();
    });

    await loadHaForm();
    this.userConfig = await fetchUsers(this.hass);
    this.requestUpdate();
  }

  render() {
    if (!customElements.get('ha-panel-config') || !this.userConfig)
      return html`
        loading...
      `;

    const path = getPath();

    return html`
      <div class="header">
        <div class="toolbar">
          <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
          <div class="main-title">
            ${localize('title', this.hass.language)}
          </div>
          <div class="version">
            v${VERSION}
          </div>
        </div>

        <ha-tabs
          scrollable
          attr-for-selected="page-name"
          .selected=${path.page}
          @iron-activate=${this.handlePageSelected}
        >
          <paper-tab page-name="general">
            ${localize('panels.general.title', this.hass.language)}
          </paper-tab>
          <paper-tab page-name="sensors">
            ${localize('panels.sensors.title', this.hass.language)}
          </paper-tab>
          <paper-tab page-name="codes">
            ${localize('panels.codes.title', this.hass.language)}
          </paper-tab>
          <paper-tab page-name="actions">
            ${localize('panels.actions.title', this.hass.language)}
          </paper-tab>
        </ha-tabs>
      </div>
      <div class="view">
        ${this.getView(path)}
      </div>
    `;
  }

  getView(path: Path) {
    const page = path.page;

    switch (page) {
      case 'general':
        return html`
          <alarm-view-general .hass=${this.hass} .narrow=${this.narrow} .path=${path}></alarm-view-general>
        `;
      case 'sensors':
        return html`
          <alarm-view-sensors .hass=${this.hass} .narrow=${this.narrow} .path=${path}></alarm-view-sensors>
        `;
      case 'codes':
        return html`
          <alarm-view-codes .hass=${this.hass} .narrow=${this.narrow} .path=${path}></alarm-view-codes>
        `;
      case 'actions':
        return html`
          <alarm-view-actions .hass=${this.hass} .narrow=${this.narrow} .path=${path}></alarm-view-actions>
        `;
      default:
        return html`
          <ha-card header="Page not found">
            <div class="card-content">
              The page you are trying to reach cannot be found. Please select a page from the menu above to continue.
            </div>
          </ha-card>
        `;
    }
  }

  handlePageSelected(ev) {
    const newPage = ev.detail.item.getAttribute('page-name');
    if (newPage !== getPath()) {
      navigate(this, exportPath(newPage));
      this.requestUpdate();
    } else {
      scrollTo(0, 0);
    }
  }

  static get styles(): CSSResultGroup {
    return css`
      ${commonStyle} :host {
        color: var(--primary-text-color);
        --paper-card-header-color: var(--primary-text-color);
      }
      .header {
        background-color: var(--app-header-background-color);
        color: var(--app-header-text-color, white);
        border-bottom: var(--app-header-border-bottom, none);
      }
      .toolbar {
        height: var(--header-height);
        display: flex;
        align-items: center;
        font-size: 20px;
        padding: 0 16px;
        font-weight: 400;
        box-sizing: border-box;
      }
      .main-title {
        margin: 0 0 0 24px;
        line-height: 20px;
        flex-grow: 1;
      }
      ha-tabs {
        margin-left: max(env(safe-area-inset-left), 24px);
        margin-right: max(env(safe-area-inset-right), 24px);
        --paper-tabs-selection-bar-color: var(--app-header-selection-bar-color, var(--app-header-text-color, #fff));
        text-transform: uppercase;
      }

      .view {
        height: calc(100vh - 112px);
        display: flex;
        justify-content: center;
      }

      .view > * {
        width: 600px;
        max-width: 600px;
      }

      .view > *:last-child {
        margin-bottom: 20px;
      }

      .version {
        font-size: 14px;
        font-weight: 500;
        color: rgba(var(--rgb-text-primary-color), 0.9);
      }
    `;
  }
}
