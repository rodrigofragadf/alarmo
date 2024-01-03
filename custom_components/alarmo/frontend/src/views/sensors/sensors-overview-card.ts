import { UnsubscribeFunc } from 'home-assistant-js-websocket';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators';

import { localize } from '../../../localize/localize';
import { TableColumn, TableData, TableFilterConfig } from '../../components/alarmo-table';
import { ESensorIcons, ESensorIconsActive, ESensorTypes } from '../../const';
import { fetchAreas, fetchSensors, saveSensor } from '../../data/websockets';
import { computeName, handleError, navigate, sortAlphabetically } from '../../helpers';
import { commonStyle } from '../../styles';
import { SubscribeMixin } from '../../subscribe-mixin';
import { AlarmoArea, AlarmoSensor, Dictionary, EArmModes, HomeAssistant } from '../../types';
import { getModesList, modesByArea } from '../../common/modes';

import '../../components/alarmo-table.ts';
import { exportPath } from '../../common/navigation';

const noArea = 'no_area';

@customElement('sensors-overview-card')
export class SensorsOverviewCard extends SubscribeMixin(LitElement) {
  @property()
  hass!: HomeAssistant;

  @property()
  narrow!: boolean;

  @property()
  areas!: Dictionary<AlarmoArea>;

  @property()
  sensors!: Dictionary<AlarmoSensor>;

  @property()
  selectedArea?: string;

  @property()
  selectedMode?: EArmModes;

  @property()
  path!: string[] | null;

  public hassSubscribe(): Promise<UnsubscribeFunc>[] {
    this._fetchData();
    return [this.hass!.connection.subscribeMessage(() => this._fetchData(), { type: 'alarmo_config_updated' })];
  }

  private async _fetchData(): Promise<void> {
    if (!this.hass) {
      return;
    }
    this.areas = await fetchAreas(this.hass);
    this.sensors = await fetchSensors(this.hass);
  }

  async firstUpdated() {
    if (this.path && this.path.length == 2 && this.path[0] == 'filter') this.selectedArea = this.path[1];
  }

  shouldUpdate(changedProps: PropertyValues) {
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    if (oldHass && changedProps.size == 1 && this.sensors) {
      return Object.keys(this.sensors).some(id => oldHass.states[id] !== this.hass.states[id]);
    }
    return true;
  }

  render() {
    if (!this.hass || !this.areas || !this.sensors) return html``;

    return html`
      <ha-card header="${localize('panels.sensors.title', this.hass.language)}">
        <div class="card-content">
          ${localize('panels.sensors.cards.sensors.description', this.hass.language)}
        </div>

        <alarmo-table
          .hass=${this.hass}
          ?selectable=${true}
          .columns=${this.tableColumns()}
          .data=${this.getTableData()}
          .filters=${this.getTableFilterOptions()}
          @row-click=${(ev: CustomEvent) => {
            navigate(this, exportPath('sensors', { params: { edit: ev.detail.id } }), true);
          }}
        >
          ${localize('panels.sensors.cards.sensors.table.no_items', this.hass.language)}
        </alarmo-table>
      </ha-card>
    `;
  }

  private tableColumns(): Dictionary<TableColumn> {
    const warningTooltip = () => html`
      <simple-tooltip animation-delay="0">
        ${localize('panels.sensors.cards.sensors.table.no_area_warning', this.hass.language)}
      </simple-tooltip>
    `;

    return {
      icon: {
        width: '40px',
        renderer: (data: AlarmoSensor) => {
          const stateObj = this.hass.states[data.entity_id];
          const type = Object.keys(ESensorTypes).find(e => ESensorTypes[e] == data.type) as ESensorTypes;
          const icon = stateObj
            ? stateObj.state === 'on'
              ? ESensorIconsActive[type]
              : ESensorIcons[type]
            : 'hass:help-circle-outline';
          return data.area == noArea
            ? html`
                ${warningTooltip()}
                <ha-icon icon="mdi:alert" style="color: var(--error-color)"></ha-icon>
              `
            : html`
                <simple-tooltip animation-delay="0">
                  ${stateObj
                    ? localize(
                        `panels.sensors.cards.editor.fields.device_type.choose.${data.type}.name`,
                        this.hass!.language
                      )
                    : this.hass.localize('state_badge.default.entity_not_found')}
                </simple-tooltip>
                <ha-icon icon="${icon}" class="${!data.enabled ? 'disabled' : ''}"></ha-icon>
              `;
        },
      },
      name: {
        title: this.hass.localize('ui.components.entity.entity-picker.entity'),
        width: '60%',
        grow: true,
        text: true,
        renderer: (data: AlarmoSensor & { name: string }) => html`
          ${data.area == noArea ? warningTooltip() : ''}
          <span class="${!data.enabled ? 'disabled' : ''}">${data.name}</span>
          <span class="secondary ${!data.enabled ? 'disabled' : ''}">${data.entity_id}</span>
        `,
      },
      modes: {
        title: localize('panels.sensors.cards.sensors.table.arm_modes', this.hass.language),
        width: '25%',
        hide: this.narrow,
        text: true,
        renderer: (data: AlarmoSensor) => html`
          ${data.area == noArea ? warningTooltip() : ''}
          <span class="${!data.enabled ? 'disabled' : ''}">
            ${data.always_on
              ? localize('panels.sensors.cards.sensors.table.always_on', this.hass!.language)
              : data.modes.length
              ? data.modes.map(e => localize(`common.modes_short.${e}`, this.hass!.language)).join(', ')
              : this.hass.localize('state_attributes.climate.preset_mode.none')}
          </span>
        `,
      },
      enabled: {
        title: localize('common.enabled', this.hass.language),
        width: '68px',
        align: 'center',
        renderer: (data: AlarmoSensor) => html`
          <ha-switch
            @click=${(ev: Event) => {
              ev.stopPropagation();
            }}
            ?checked=${data.enabled}
            @change=${(ev: Event) => this.toggleEnabled(ev, data.entity_id)}
          ></ha-switch>
        `,
      },
    };
  }

  private getTableData(): Record<string, any>[] {
    const sensorsList = Object.keys(this.sensors).map(id => {
      const stateObj = this.hass!.states[id];
      const config = this.sensors[id];
      const modesList = config.area ? modesByArea(this.areas[config.area]) : getModesList(this.areas);
      const res: TableData & { name: string } = {
        ...config,
        id: id,
        name: computeName(stateObj),
        modes: config.always_on ? modesList : config.modes.filter(e => modesList.includes(e)),
        warning: !config.area,
        area: config.area || noArea,
      };
      //if (!config.area) res = { ...res, warning: localize('panels.sensors.cards.sensors.no_area', this.hass.language) };
      return res;
    });
    sensorsList.sort(sortAlphabetically);
    return sensorsList;
  }

  toggleEnabled(ev: Event, id: string) {
    const enabled = (ev.target as HTMLInputElement).checked;
    saveSensor(this.hass!, { entity_id: id, enabled: enabled })
      .catch(e => handleError(e, ev))
      .then();
  }

  removeCustomName(id: string) {
    const data = {
      entity_id: id,
      name: '',
    };
    saveSensor(this.hass, data);
  }

  private getTableFilterOptions() {
    let areaFilterOptions = Object.values(this.areas)
      .map(e =>
        Object({
          value: e.area_id,
          name: e.name,
          badge: (list: AlarmoSensor[]) => list.filter(item => item.area == e.area_id).length,
        })
      )
      .sort(sortAlphabetically);

    if (Object.values(this.sensors).filter(e => !e.area).length)
      areaFilterOptions = [
        {
          value: noArea,
          name: this.hass.localize('state_attributes.climate.preset_mode.none'),
          badge: (list: AlarmoSensor[]) => list.filter(item => item.area == noArea).length,
        },
        ...areaFilterOptions,
      ];

    const modeFilterOptions = getModesList(this.areas).map(e =>
      Object({
        value: e,
        name: localize(`common.modes_short.${e}`, this.hass!.language),
        badge: (list: AlarmoSensor[]) => list.filter(item => item.modes.includes(e)).length,
      })
    );

    const filterConfig: TableFilterConfig = {
      area: {
        name: localize(
          'components.table.filter.item',
          this.hass.language,
          'name',
          localize('panels.actions.cards.new_action.fields.area.heading', this.hass.language)
        ),
        items: areaFilterOptions,
        value: this.selectedArea ? [this.selectedArea] : [],
      },
      modes: {
        name: localize(
          'components.table.filter.item',
          this.hass.language,
          'name',
          localize('panels.actions.cards.new_action.fields.mode.heading', this.hass.language)
        ),
        items: modeFilterOptions,
        value: this.selectedMode ? [this.selectedMode] : [],
      },
    };
    return filterConfig;
  }

  static styles = commonStyle;
}
