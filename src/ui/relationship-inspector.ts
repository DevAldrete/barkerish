import { nothing, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { Cardinality, Optionality, Relationship, RelationshipEnd } from '../domain/types.js';
import { verbalizeRelationship } from '../notation/barker.js';
import { StoreElement } from './store-element.js';

const PANEL_STYLES = css`
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

  input[type='text'],
  select {
    font: inherit;
    font-size: 0.85rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    color: #0f172a;
    background: #ffffff;
  }

  .end {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    background: #ffffff;
  }

  .end__title {
    font-size: 0.72rem;
    font-weight: 600;
    color: #334155;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .check {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    color: #475569;
  }

  .sentences {
    font-size: 0.75rem;
    line-height: 1.4;
    color: #475569;
    background: #f1f5f9;
    border-radius: 8px;
    padding: 0.55rem 0.65rem;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
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

  button.danger {
    border-color: #fecaca;
    color: #b91c1c;
  }
`;

@customElement('relationship-inspector')
export class RelationshipInspector extends StoreElement {
  static override styles = PANEL_STYLES;

  override render() {
    const selection = this.store.selection;
    if (selection?.kind !== 'relationship') {
      return nothing;
    }

    const relationship = this.store.diagram.relationships.find(
      (candidate) => candidate.id === selection.id,
    );
    if (!relationship) {
      return nothing;
    }

    const sourceName = this.#entityName(relationship.source.entityId);
    const targetName = this.#entityName(relationship.target.entityId);
    const sentences = verbalizeRelationship(relationship, sourceName, targetName);

    return html`
      <section class="panel">
        <h2>Relationship</h2>
        ${this.#renderEnd(relationship, 'source', sourceName)}
        ${this.#renderEnd(relationship, 'target', targetName)}
        <label class="check">
          <input
            type="checkbox"
            .checked=${relationship.identifying}
            @change=${this.#onIdentifying(relationship)}
          />
          Identifying
        </label>
        <p class="sentences">
          <span>${sentences.source}</span>
          <span>${sentences.target}</span>
        </p>
        <button
          class="danger"
          @click=${() =>
            this.store.dispatch({ type: 'DeleteRelationship', relationshipId: relationship.id })}
        >
          Delete relationship
        </button>
      </section>
    `;
  }

  #renderEnd(relationship: Relationship, which: 'source' | 'target', entityName: string) {
    const end = relationship[which];

    return html`
      <div class="end">
        <span class="end__title">${entityName}</span>
        <label class="field">
          Label
          <input
            type="text"
            .value=${which === 'source' ? relationship.sourceLabel : relationship.targetLabel}
            @input=${this.#onLabel(relationship, which)}
            @change=${() => this.store.endInteraction()}
          />
        </label>
        <div class="grid-2">
          <label class="field">
            Optionality
            <select @change=${this.#onOptionality(relationship, which)}>
              ${(['mandatory', 'optional'] as Optionality[]).map(
                (value) =>
                  html`<option value=${value} ?selected=${end.optionality === value}>
                    ${value}
                  </option>`,
              )}
            </select>
          </label>
          <label class="field">
            Cardinality
            <select @change=${this.#onCardinality(relationship, which)}>
              ${(['one', 'many'] as Cardinality[]).map(
                (value) =>
                  html`<option value=${value} ?selected=${end.cardinality === value}>
                    ${value}
                  </option>`,
              )}
            </select>
          </label>
        </div>
      </div>
    `;
  }

  #entityName(entityId: string): string {
    return this.store.diagram.entities.find((entity) => entity.id === entityId)?.name ?? 'unknown';
  }

  #onLabel(relationship: Relationship, which: 'source' | 'target') {
    return (event: Event): void => {
      const value = (event.target as HTMLInputElement).value;
      this.store.dispatch(
        {
          type: 'UpdateRelationship',
          relationshipId: relationship.id,
          patch: which === 'source' ? { sourceLabel: value } : { targetLabel: value },
        },
        { coalesceKey: `rel-label:${relationship.id}:${which}` },
      );
    };
  }

  #onOptionality(relationship: Relationship, which: 'source' | 'target') {
    return (event: Event): void => {
      const value = (event.target as HTMLSelectElement).value as Optionality;
      this.#updateEnd(relationship, which, { optionality: value });
    };
  }

  #onCardinality(relationship: Relationship, which: 'source' | 'target') {
    return (event: Event): void => {
      const value = (event.target as HTMLSelectElement).value as Cardinality;
      this.#updateEnd(relationship, which, { cardinality: value });
    };
  }

  #onIdentifying(relationship: Relationship) {
    return (event: Event): void => {
      this.store.dispatch({
        type: 'UpdateRelationship',
        relationshipId: relationship.id,
        patch: { identifying: (event.target as HTMLInputElement).checked },
      });
    };
  }

  #updateEnd(
    relationship: Relationship,
    which: 'source' | 'target',
    patch: Partial<RelationshipEnd>,
  ): void {
    const end: RelationshipEnd = { ...relationship[which], ...patch };
    this.store.dispatch({
      type: 'UpdateRelationship',
      relationshipId: relationship.id,
      patch: which === 'source' ? { source: end } : { target: end },
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'relationship-inspector': RelationshipInspector;
  }
}
