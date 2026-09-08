import { useState } from "react";
import {
  Building2,
  Clock3,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Users,
  X,
} from "lucide-react";
import type { Data, Space } from "../types";

type Props = {
  data: Data;
  newSpace: () => void;
  onEdit: (space: Space) => void;
  onDelete: (space: Space) => void;
};

export function SpacesView({ data, newSpace, onEdit, onDelete }: Props) {
  const [layout, setLayout] = useState<"cards" | "list">("cards");
  const sortedSpaces = data.spaces
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <div className="spaces-view">
      <div className="section-heading">
        <div>
          <h2>Salas e espaços</h2>
          <p>Horários padrão e capacidade de cada ambiente</p>
        </div>
        <div className="spaces-heading-actions">
          <div className="layout-switch">
            <button
              className={layout === "cards" ? "active" : ""}
              onClick={() => setLayout("cards")}
              title="Visualização em blocos"
            >
              <LayoutGrid />
            </button>
            <button
              className={layout === "list" ? "active" : ""}
              onClick={() => setLayout("list")}
              title="Visualização em lista"
            >
              <List />
            </button>
          </div>
          <button className="new-button" onClick={newSpace}>
            <Plus /> Cadastrar espaço
          </button>
        </div>
      </div>
      <div
        className={`space-grid ${layout === "list" ? "space-list-view" : ""}`}
      >
        {sortedSpaces.map((space) => (
          <article key={space.id}>
            <div className="space-top">
              <span style={{ background: space.color }}>
                <Building2 />
              </span>
              <div className="space-actions">
                <i className="available">
                  {space.active ? "Disponível" : "Inativo"}
                </i>
                <button
                  className="outline"
                  onClick={() => onEdit(space)}
                  title="Editar espaço"
                >
                  <Pencil />
                </button>
                <button
                  className="outline danger-outline"
                  onClick={() => onDelete(space)}
                  title="Excluir espaço"
                >
                  <X />
                </button>
              </div>
            </div>
            <h3>{space.name}</h3>
            <p>{space.location}</p>
            <div className="space-meta">
              <span>
                <Users />
                {space.capacity} pessoas
              </span>
              <span>
                <Clock3 />
                {space.availableFrom}–{space.availableTo}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
