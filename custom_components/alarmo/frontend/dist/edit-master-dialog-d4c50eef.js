define(["exports","./alarm-panel-a368a6aa"],(function(a,t){"use strict";a.EditMasterDialog=class extends t.s{constructor(){super(...arguments),this.name=""}async showDialog(a){this._params=a;const e=await t.fetchConfig(this.hass);this.name=e.master.name||"",await this.updateComplete}async closeDialog(){this._params=void 0}render(){return this._params?t.x`
      <ha-dialog open .heading=${!0} @closed=${this.closeDialog} @close-dialog=${this.closeDialog}>
        <ha-dialog-header slot="heading">
          <ha-icon-button slot="navigationIcon" dialogAction="cancel" .path=${t.mdiClose}></ha-icon-button>
          <span slot="title">${t.localize("panels.general.dialogs.edit_master.title",this.hass.language)}</span>
        </ha-dialog-header>
        <div class="wrapper">
          <ha-textfield
            label=${this.hass.localize("ui.components.area-picker.add_dialog.name")}
            @input=${a=>this.name=a.target.value}
            value="${this.name}"
          ></ha-textfield>
          <span class="note">${t.localize("panels.general.dialogs.edit_area.name_warning",this.hass.language)}</span>
        </div>
        <mwc-button slot="primaryAction" @click=${this.saveClick}>
          ${this.hass.localize("ui.common.save")}
        </mwc-button>
        <mwc-button slot="secondaryAction" @click=${this.closeDialog}>
          ${this.hass.localize("ui.common.cancel")}
        </mwc-button>
      </ha-dialog>
    `:t.x``}saveClick(){const a=this.name.trim();a.length&&t.saveConfig(this.hass,{master:{enabled:!0,name:a}}).catch().then(()=>{this.closeDialog()})}static get styles(){return t.i`
      div.wrapper {
        color: var(--primary-text-color);
      }
      span.note {
        color: var(--secondary-text-color);
      }
      ha-textfield {
        display: block;
      }
    `}},t.__decorate([t.n({attribute:!1})],a.EditMasterDialog.prototype,"hass",void 0),t.__decorate([t.t()],a.EditMasterDialog.prototype,"_params",void 0),t.__decorate([t.n()],a.EditMasterDialog.prototype,"name",void 0),a.EditMasterDialog=t.__decorate([t.e("edit-master-dialog")],a.EditMasterDialog)}));
