import { nothing, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import type { Attribute, Entity } from '../domain/types.js';
import { addAttribute } from '../store/actions.js';
import { BASE_STYLES } from './base-styles.js';
import { StoreElement } from './store-element.js';

const PANEL_STYLES = css`
  ${BASE_STYLES}

  :host {
    display: block;
    height: 100%;
    overflow: auto;
  }

  .panel {
    padding: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  h2 {
    margin: 0;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #475569;
  }

  input[type='text'] {
    font: inherit;
    font-size: 0.85rem;
    width: 100%;
    min-width: 0;
    padding: 0.35rem 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    color: #0f172a;
  }

  .attributes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .attribute {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    background: #ffffff;
  }

  .attribute__top {
    display: flex;
    gap: 0.4rem;
  }

  .attribute__top input {
    flex: 1;
    min-width: 0;
  }

  .flags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    font-size: 0.72rem;
    color: #475569;
  }

  .flags label {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .row-actions {
    display: flex;
    gap: 0.25rem;
  }

  button {
    font: inherit;
    font-size: 0.78rem;
    padding: 0.3rem 0.55rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #f8fafc;
    color: inherit;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #eef2f7;
  }

  button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  button.icon {
    padding: 0.25rem 0.45rem;
    line-height: 1;
  }

  button.danger {
    border-color: #fecaca;
    color: #b91c1c;
  }

  .empty {
    padding: 0.9rem;
    font-size: 0.8rem;
    color: #94a3b8;
  }
`;

@customElement('entity-inspector')
export class EntityInspector extends StoreElement {
  static override styles = PANEL_STYLES;

  @query('input[data-role="entity-name"]') private nameInput?: HTMLInputElement;

  /** Focus and select the entity name field (used on double-click). */
  focusPrimaryField(): void {
    this.nameInput?.focus();
    this.nameInput?.select();
  }

  override render() {
    const selection = this.store.selection;
    if (selection?.kind !== 'entity') {
      return nothing;
    }

    const entity = this.store.diagram.entities.find((candidate) => candidate.id === selection.id);
    if (!entity) {
      return nothing;
    }

    return html`
      <section class="panel">
        <h2>Entity</h2>
        <label class="field">
          Name
          <input
            type="text"
            data-role="entity-name"
            .value=${entity.name}
            @input=${this.#onRename(entity)}
            @change=${() => this.store.endInteraction()}
          />
        </label>
        <div class="attributes">
          ${entity.attributes.map((attribute, index) =>
            this.#renderAttribute(entity, attribute, index),
          )}
        </div>
        <button @click=${() => addAttribute(this.store, entity.id)}>Add attribute</button>
        <button
          class="danger"
          @click=${() => this.store.dispatch({ type: 'DeleteEntity', entityId: entity.id })}
        >
          Delete entity
        </button>
      </section>
    `;
  }

  #renderAttribute(entity: Entity, attribute: Attribute, index: number) {
    return html`
      <div class="attribute">
        <div class="attribute__top">
          <input
            type="text"
            aria-label="Attribute name"
            .value=${attribute.name}
            @input=${this.#onAttributeInput(entity, attribute, 'name')}
            @change=${() => this.store.endInteraction()}
          />
          <input
            type="text"
            aria-label="Attribute data type"
            placeholder="type"
            .value=${attribute.dataType}
            @input=${this.#onAttributeInput(entity, attribute, 'dataType')}
            @change=${() => this.store.endInteraction()}
          />
        </div>
        <div class="flags">
          <label>
            <input
              type="checkbox"
              .checked=${attribute.primaryKey}
              @change=${this.#onFlag(entity, attribute, 'primaryKey')}
            />
            PK
          </label>
          <label>
            <input
              type="checkbox"
              .checked=${attribute.foreignKey}
              @change=${this.#onFlag(entity, attribute, 'foreignKey')}
            />
            FK
          </label>
          <label>
            <input
              type="checkbox"
              .checked=${attribute.nullable}
              @change=${this.#onFlag(entity, attribute, 'nullable')}
            />
            Nullable
          </label>
          <label>
            <input
              type="checkbox"
              .checked=${attribute.unique}
              @change=${this.#onFlag(entity, attribute, 'unique')}
            />
            Unique
          </label>
        </div>
        <div class="row-actions">
          <button
            class="icon"
            title="Move up"
            ?disabled=${index === 0}
            @click=${() => this.#reorder(entity.id, attribute.id, index - 1)}
          >
            ↑
          </button>
          <button
            class="icon"
            title="Move down"
            ?disabled=${index === entity.attributes.length - 1}
            @click=${() => this.#reorder(entity.id, attribute.id, index + 1)}
          >
            ↓
          </button>
          <button
            class="icon danger"
            title="Delete attribute"
            @click=${() =>
              this.store.dispatch({
                type: 'DeleteAttribute',
                entityId: entity.id,
                attributeId: attribute.id,
              })}
          >
            ✕
          </button>
        </div>
      </div>
    `;
  }

  #onRename(entity: Entity) {
    return (event: Event): void => {
      this.store.dispatch(
        {
          type: 'RenameEntity',
          entityId: entity.id,
          name: (event.target as HTMLInputElement).value,
        },
        { coalesceKey: `rename:${entity.id}` },
      );
    };
  }

  #onAttributeInput(entity: Entity, attribute: Attribute, field: 'name' | 'dataType') {
    return (event: Event): void => {
      const value = (event.target as HTMLInputElement).value;
      this.store.dispatch(
        {
          type: 'UpdateAttribute',
          entityId: entity.id,
          attributeId: attribute.id,
          patch: field === 'name' ? { name: value } : { dataType: value },
        },
        { coalesceKey: `attr-${field}:${attribute.id}` },
      );
    };
  }

  #onFlag(
    entity: Entity,
    attribute: Attribute,
    field: 'primaryKey' | 'foreignKey' | 'nullable' | 'unique',
  ) {
    return (event: Event): void => {
      const checked = (event.target as HTMLInputElement).checked;
      const patch =
        field === 'primaryKey'
          ? { primaryKey: checked }
          : field === 'foreignKey'
            ? { foreignKey: checked }
            : field === 'nullable'
              ? { nullable: checked }
              : { unique: checked };

      this.store.dispatch({
        type: 'UpdateAttribute',
        entityId: entity.id,
        attributeId: attribute.id,
        patch,
      });
    };
  }

  #reorder(entityId: string, attributeId: string, toIndex: number): void {
    this.store.dispatch({ type: 'ReorderAttribute', entityId, attributeId, toIndex });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'entity-inspector': EntityInspector;
  }
}
