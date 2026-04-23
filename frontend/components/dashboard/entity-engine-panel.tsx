"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { formatInstant } from "@/lib/utils";
import type {
  ApiResponse,
  EntityApiError,
  EntityDefinitionResponse,
  EntityFieldDefinition,
  EntityFieldType,
  EntityRecordResponse,
  PageResponse
} from "@/lib/types";

const fieldTypeOptions: Array<{ label: string; value: EntityFieldType }> = [
  { label: "Texto curto", value: "STRING" },
  { label: "Texto longo", value: "TEXT" },
  { label: "Numero", value: "NUMBER" },
  { label: "Booleano", value: "BOOLEAN" },
  { label: "Email", value: "EMAIL" },
  { label: "URL", value: "URL" },
  { label: "Telefone", value: "PHONE" },
  { label: "Data", value: "DATE" },
  { label: "Lista", value: "ENUM" },
  { label: "Relacao", value: "RELATION" }
];

type EntityEnginePanelProps = {
  tenantId: string | null;
  tenantName: string | null;
};

type DraftField = {
  id: string;
  name: string;
  label: string;
  type: EntityFieldType;
  required: boolean;
  optionsText: string;
  min: string;
  max: string;
  minLength: string;
  maxLength: string;
  pattern: string;
};

type RecordFormValue = string | boolean;

const emptyRecordPage: PageResponse<EntityRecordResponse> = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0
};

function createDraftField(): DraftField {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    label: "",
    type: "STRING",
    required: false,
    optionsText: "",
    min: "",
    max: "",
    minLength: "",
    maxLength: "",
    pattern: ""
  };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatApiError(error: EntityApiError | null, fallback: string) {
  if (!error) {
    return fallback;
  }

  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors.map((entry) => `${entry.field}: ${entry.message}`).join(" | ");
  }

  return error.message || fallback;
}

function buildFieldDefinition(field: DraftField): EntityFieldDefinition {
  const validations: Record<string, number | string> = {};
  const type = field.type;

  if (type === "STRING" || type === "TEXT") {
    if (field.minLength.trim()) {
      validations.minLength = Number(field.minLength);
    }
    if (field.maxLength.trim()) {
      validations.maxLength = Number(field.maxLength);
    }
    if (field.pattern.trim()) {
      validations.pattern = field.pattern.trim();
    }
  }

  if (type === "NUMBER") {
    if (field.min.trim()) {
      validations.min = Number(field.min);
    }
    if (field.max.trim()) {
      validations.max = Number(field.max);
    }
  }

  return {
    name: field.name.trim(),
    label: field.label.trim() || field.name.trim(),
    type,
    required: field.required,
    options:
      type === "ENUM"
        ? field.optionsText
            .split(",")
            .map((option) => option.trim())
            .filter(Boolean)
        : undefined,
    validations: Object.keys(validations).length > 0 ? validations : undefined
  };
}

function buildInitialRecordValues(fields: EntityFieldDefinition[]) {
  return fields.reduce<Record<string, RecordFormValue>>((accumulator, field) => {
    if (field.type === "BOOLEAN") {
      accumulator[field.name] = Boolean(field.defaultValue);
      return accumulator;
    }

    if (typeof field.defaultValue === "string" || typeof field.defaultValue === "number") {
      accumulator[field.name] = String(field.defaultValue);
      return accumulator;
    }

    accumulator[field.name] = "";
    return accumulator;
  }, {});
}

function serializeRecordValue(field: EntityFieldDefinition, rawValue: RecordFormValue) {
  if (field.type === "BOOLEAN") {
    return Boolean(rawValue);
  }

  if (typeof rawValue !== "string") {
    return rawValue;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return undefined;
  }

  if (field.type === "NUMBER") {
    return Number(trimmed);
  }

  return trimmed;
}

function formatRecordValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "Sim" : "Nao";
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2);
  }

  if (value === null || typeof value === "undefined" || value === "") {
    return "—";
  }

  return String(value);
}

export default function EntityEnginePanel({
  tenantId,
  tenantName
}: EntityEnginePanelProps) {
  const router = useRouter();
  const [entities, setEntities] = useState<EntityDefinitionResponse[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [entitiesError, setEntitiesError] = useState<string | null>(null);
  const [selectedEntitySlug, setSelectedEntitySlug] = useState<string | null>(null);
  const [recordsPage, setRecordsPage] =
    useState<PageResponse<EntityRecordResponse>>(emptyRecordPage);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [entityName, setEntityName] = useState("");
  const [entitySlug, setEntitySlug] = useState("");
  const [entityDisplayName, setEntityDisplayName] = useState("");
  const [entityDescription, setEntityDescription] = useState("");
  const [entityIcon, setEntityIcon] = useState("");
  const [draftFields, setDraftFields] = useState<DraftField[]>([createDraftField()]);
  const [entityActionError, setEntityActionError] = useState<string | null>(null);
  const [entityActionSuccess, setEntityActionSuccess] = useState<string | null>(null);
  const [recordFormValues, setRecordFormValues] = useState<Record<string, RecordFormValue>>({});
  const [recordActionError, setRecordActionError] = useState<string | null>(null);
  const [recordActionSuccess, setRecordActionSuccess] = useState<string | null>(null);
  const [isCreatingEntity, startCreateEntityTransition] = useTransition();
  const [isCreatingRecord, startCreateRecordTransition] = useTransition();

  const selectedEntity = useMemo(
    () => entities.find((entity) => entity.slug === selectedEntitySlug) ?? null,
    [entities, selectedEntitySlug]
  );

  useEffect(() => {
    if (!tenantId) {
      setEntities([]);
      setRecordsPage(emptyRecordPage);
      setSelectedEntitySlug(null);
      return;
    }

    let active = true;

    async function loadEntities() {
      setEntitiesLoading(true);
      setEntitiesError(null);
      setSelectedEntitySlug(null);
      setRecordsPage(emptyRecordPage);

      const response = await fetch(`/api/entities/definitions?tenantId=${tenantId}`, {
        cache: "no-store"
      });

      if (!active) {
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as EntityApiError | null;
        setEntitiesError(body?.message || "Nao foi possivel carregar as entidades.");
        setEntities([]);
        setEntitiesLoading(false);
        return;
      }

      const body =
        (await response.json()) as ApiResponse<EntityDefinitionResponse[]>;
      const nextEntities = body.data ?? [];
      setEntities(nextEntities);
      setSelectedEntitySlug((current) => {
        if (current && nextEntities.some((entity) => entity.slug === current)) {
          return current;
        }

        return nextEntities[0]?.slug ?? null;
      });
      setEntitiesLoading(false);
    }

    void loadEntities();

    return () => {
      active = false;
    };
  }, [router, tenantId]);

  useEffect(() => {
    if (!tenantId || !selectedEntitySlug) {
      setRecordsPage(emptyRecordPage);
      setRecordActionError(null);
      return;
    }

    let active = true;

    async function loadRecords() {
      setRecordsLoading(true);
      setRecordsError(null);

      const response = await fetch(
        `/api/entities/${selectedEntitySlug}/records?tenantId=${tenantId}&page=0&size=20`,
        { cache: "no-store" }
      );

      if (!active) {
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as EntityApiError | null;
        setRecordsError(body?.message || "Nao foi possivel carregar os registros.");
        setRecordsPage(emptyRecordPage);
        setRecordsLoading(false);
        return;
      }

      const body =
        (await response.json()) as ApiResponse<PageResponse<EntityRecordResponse>>;
      setRecordsPage(body.data ?? emptyRecordPage);
      setRecordsLoading(false);
    }

    void loadRecords();

    return () => {
      active = false;
    };
  }, [router, selectedEntitySlug, tenantId]);

  useEffect(() => {
    if (!selectedEntity) {
      setRecordFormValues({});
      return;
    }

    setRecordFormValues(buildInitialRecordValues(selectedEntity.fields));
    setRecordActionError(null);
    setRecordActionSuccess(null);
  }, [selectedEntity]);

  function handleNameBlur() {
    if (entitySlug.trim()) {
      return;
    }

    setEntitySlug(slugify(entityName));
  }

  function updateDraftField(id: string, patch: Partial<DraftField>) {
    setDraftFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field))
    );
  }

  function addDraftField() {
    setDraftFields((current) => [...current, createDraftField()]);
  }

  function removeDraftField(id: string) {
    setDraftFields((current) =>
      current.length === 1 ? current : current.filter((field) => field.id !== id)
    );
  }

  function resetEntityForm() {
    setEntityName("");
    setEntitySlug("");
    setEntityDisplayName("");
    setEntityDescription("");
    setEntityIcon("");
    setDraftFields([createDraftField()]);
  }

  function handleCreateEntity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenantId) {
      setEntityActionError("Selecione um tenant antes de criar entidades.");
      return;
    }

    const normalizedFields = draftFields
      .map(buildFieldDefinition)
      .filter((field) => field.name);

    if (normalizedFields.length === 0) {
      setEntityActionError("Adicione pelo menos um campo na entidade.");
      return;
    }

    setEntityActionError(null);
    setEntityActionSuccess(null);

    startCreateEntityTransition(async () => {
      const response = await fetch("/api/entities/definitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenantId,
          name: entityName.trim(),
          slug: entitySlug.trim(),
          displayName: entityDisplayName.trim() || null,
          description: entityDescription.trim() || null,
          icon: entityIcon.trim() || null,
          fields: normalizedFields
        })
      });

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as EntityApiError | null;
        setEntityActionError(
          formatApiError(body, "Falha ao criar a entidade. Revise os campos.")
        );
        return;
      }

      const body =
        (await response.json()) as ApiResponse<EntityDefinitionResponse>;
      const createdEntity = body.data;

      setEntities((current) => [createdEntity, ...current]);
      setSelectedEntitySlug(createdEntity.slug);
      setEntityActionSuccess(body.message || "Entidade criada com sucesso.");
      resetEntityForm();
    });
  }

  function handleRecordValueChange(fieldName: string, value: RecordFormValue) {
    setRecordFormValues((current) => ({
      ...current,
      [fieldName]: value
    }));
  }

  function handleCreateRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenantId || !selectedEntity) {
      setRecordActionError("Selecione um tenant e uma entidade antes de criar registros.");
      return;
    }

    const data = selectedEntity.fields.reduce<Record<string, unknown>>((accumulator, field) => {
      const serialized = serializeRecordValue(field, recordFormValues[field.name] ?? "");

      if (typeof serialized !== "undefined") {
        accumulator[field.name] = serialized;
      }

      return accumulator;
    }, {});

    setRecordActionError(null);
    setRecordActionSuccess(null);

    startCreateRecordTransition(async () => {
      const response = await fetch(`/api/entities/${selectedEntity.slug}/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenantId,
          data
        })
      });

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as EntityApiError | null;
        setRecordActionError(
          formatApiError(body, "Falha ao salvar o registro dinamico.")
        );
        return;
      }

      const body = (await response.json()) as ApiResponse<EntityRecordResponse>;
      const createdRecord = body.data;

      setRecordsPage((current) => ({
        ...current,
        content: [createdRecord, ...current.content].slice(0, current.size || 20),
        totalElements: current.totalElements + 1
      }));
      setRecordFormValues(buildInitialRecordValues(selectedEntity.fields));
      setRecordActionSuccess(body.message || "Registro criado com sucesso.");
    });
  }

  if (!tenantId) {
    return (
      <section className="panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Entity Engine</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Selecione um tenant para carregar schema, entidades dinamicas e registros.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Entity Engine</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Builder dinamico ativo para o tenant{" "}
            <span className="font-semibold text-ink">{tenantName ?? tenantId}</span>.
          </p>
        </div>
        <div className="rounded-full border border-slate-900/8 bg-white/80 px-4 py-3 text-sm text-slate-700">
          {entitiesLoading ? "Carregando schema..." : `${entities.length} entidades ativas`}
        </div>
      </div>

      {entitiesError ? (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {entitiesError}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <section className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-ink">Entidades</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Cada definicao vira schema JSON validado pelo backend.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {entitiesLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-[1.3rem] border border-slate-900/8 bg-white/70"
                  />
                ))
              ) : entities.length > 0 ? (
                entities.map((entity) => {
                  const isSelected = entity.slug === selectedEntitySlug;
                  return (
                    <button
                      key={entity.id}
                      className={`w-full rounded-[1.3rem] border p-4 text-left transition ${
                        isSelected
                          ? "border-slate-900/30 bg-slate-900 text-white shadow-lg"
                          : "border-slate-900/8 bg-white/80 text-ink"
                      }`}
                      onClick={() => setSelectedEntitySlug(entity.slug)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">
                            {entity.displayName || entity.name}
                          </p>
                          <p
                            className={`mt-1 text-sm ${
                              isSelected ? "text-white/80" : "text-slate-600"
                            }`}
                          >
                            <span className="font-mono">{entity.slug}</span> •{" "}
                            {entity.fields.length} campos
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                            isSelected
                              ? "bg-white/15 text-white"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {entity.active ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      {entity.description ? (
                        <p
                          className={`mt-3 text-sm leading-6 ${
                            isSelected ? "text-white/78" : "text-slate-600"
                          }`}
                        >
                          {entity.description}
                        </p>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[1.3rem] border border-dashed border-slate-900/16 bg-white/60 p-5 text-sm leading-7 text-slate-600">
                  Nenhuma entidade ativa. Crie a primeira definicao ao lado para habilitar
                  registros dinamicos neste tenant.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5">
            <div>
              <h3 className="text-xl font-semibold text-ink">Nova entidade</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                O frontend monta o payload e o `entity-engine` persiste o schema por tenant.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleCreateEntity}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Nome interno</span>
                <input
                  required
                  className="field"
                  onBlur={handleNameBlur}
                  onChange={(event) => setEntityName(event.target.value)}
                  placeholder="Lead"
                  type="text"
                  value={entityName}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Slug</span>
                  <input
                    required
                    className="field font-mono"
                    onChange={(event) => setEntitySlug(slugify(event.target.value))}
                    pattern="^[a-z][a-z0-9_]*$"
                    placeholder="lead"
                    type="text"
                    value={entitySlug}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nome exibido</span>
                  <input
                    className="field"
                    onChange={(event) => setEntityDisplayName(event.target.value)}
                    placeholder="Leads comerciais"
                    type="text"
                    value={entityDisplayName}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Descricao</span>
                  <input
                    className="field"
                    onChange={(event) => setEntityDescription(event.target.value)}
                    placeholder="Pipeline inicial de prospeccao"
                    type="text"
                    value={entityDescription}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Icone</span>
                  <input
                    className="field"
                    onChange={(event) => setEntityIcon(event.target.value)}
                    placeholder="briefcase"
                    type="text"
                    value={entityIcon}
                  />
                </label>
              </div>

              <div className="space-y-4 rounded-[1.4rem] bg-slate-900/4 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Campos dinamicos</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Tipos suportados pelo backend: texto, numero, booleano, enum, data e relacao.
                    </p>
                  </div>
                  <button className="button-secondary" onClick={addDraftField} type="button">
                    Adicionar campo
                  </button>
                </div>

                <div className="space-y-4">
                  {draftFields.map((field, index) => {
                    const isTextual =
                      field.type === "STRING" || field.type === "TEXT";
                    const isNumber = field.type === "NUMBER";
                    const isEnum = field.type === "ENUM";

                    return (
                      <div
                        key={field.id}
                        className="rounded-[1.3rem] border border-slate-900/8 bg-white/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">
                            Campo {index + 1}
                          </p>
                          <button
                            className="text-sm font-medium text-slate-500 transition hover:text-red-600"
                            onClick={() => removeDraftField(field.id)}
                            type="button"
                          >
                            Remover
                          </button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">
                              Nome do campo
                            </span>
                            <input
                              required
                              className="field font-mono"
                              onChange={(event) =>
                                updateDraftField(field.id, {
                                  name: slugify(event.target.value)
                                })
                              }
                              placeholder="status"
                              type="text"
                              value={field.name}
                            />
                          </label>

                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Label</span>
                            <input
                              className="field"
                              onChange={(event) =>
                                updateDraftField(field.id, { label: event.target.value })
                              }
                              placeholder="Status"
                              type="text"
                              value={field.label}
                            />
                          </label>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Tipo</span>
                            <select
                              className="field"
                              onChange={(event) =>
                                updateDraftField(field.id, {
                                  type: event.target.value as EntityFieldType,
                                  optionsText: "",
                                  min: "",
                                  max: "",
                                  minLength: "",
                                  maxLength: "",
                                  pattern: ""
                                })
                              }
                              value={field.type}
                            >
                              {fieldTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="mt-8 inline-flex items-center gap-3">
                            <input
                              checked={field.required}
                              onChange={(event) =>
                                updateDraftField(field.id, { required: event.target.checked })
                              }
                              type="checkbox"
                            />
                            <span className="text-sm font-medium text-slate-700">
                              Obrigatorio
                            </span>
                          </label>
                        </div>

                        {isEnum ? (
                          <label className="mt-4 block space-y-2">
                            <span className="text-sm font-medium text-slate-700">
                              Opcoes separadas por virgula
                            </span>
                            <input
                              className="field"
                              onChange={(event) =>
                                updateDraftField(field.id, {
                                  optionsText: event.target.value
                                })
                              }
                              placeholder="novo, qualificado, ganho"
                              type="text"
                              value={field.optionsText}
                            />
                          </label>
                        ) : null}

                        {isTextual ? (
                          <div className="mt-4 grid gap-4 md:grid-cols-3">
                            <label className="block space-y-2">
                              <span className="text-sm font-medium text-slate-700">
                                Min chars
                              </span>
                              <input
                                className="field"
                                inputMode="numeric"
                                onChange={(event) =>
                                  updateDraftField(field.id, {
                                    minLength: event.target.value
                                  })
                                }
                                placeholder="2"
                                type="text"
                                value={field.minLength}
                              />
                            </label>
                            <label className="block space-y-2">
                              <span className="text-sm font-medium text-slate-700">
                                Max chars
                              </span>
                              <input
                                className="field"
                                inputMode="numeric"
                                onChange={(event) =>
                                  updateDraftField(field.id, {
                                    maxLength: event.target.value
                                  })
                                }
                                placeholder="255"
                                type="text"
                                value={field.maxLength}
                              />
                            </label>
                            <label className="block space-y-2">
                              <span className="text-sm font-medium text-slate-700">
                                Regex
                              </span>
                              <input
                                className="field font-mono"
                                onChange={(event) =>
                                  updateDraftField(field.id, {
                                    pattern: event.target.value
                                  })
                                }
                                placeholder="^[A-Z]+$"
                                type="text"
                                value={field.pattern}
                              />
                            </label>
                          </div>
                        ) : null}

                        {isNumber ? (
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <label className="block space-y-2">
                              <span className="text-sm font-medium text-slate-700">
                                Valor minimo
                              </span>
                              <input
                                className="field"
                                inputMode="decimal"
                                onChange={(event) =>
                                  updateDraftField(field.id, { min: event.target.value })
                                }
                                placeholder="0"
                                type="text"
                                value={field.min}
                              />
                            </label>
                            <label className="block space-y-2">
                              <span className="text-sm font-medium text-slate-700">
                                Valor maximo
                              </span>
                              <input
                                className="field"
                                inputMode="decimal"
                                onChange={(event) =>
                                  updateDraftField(field.id, { max: event.target.value })
                                }
                                placeholder="100"
                                type="text"
                                value={field.max}
                              />
                            </label>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {entityActionError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {entityActionError}
                </p>
              ) : null}

              {entityActionSuccess ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {entityActionSuccess}
                </p>
              ) : null}

              <button className="button-primary w-full" disabled={isCreatingEntity} type="submit">
                {isCreatingEntity ? "Publicando schema..." : "Criar entidade"}
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-ink">Registros dinamicos</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {selectedEntity
                    ? `Formulario e listagem montados a partir da entidade ${selectedEntity.displayName || selectedEntity.name}.`
                    : "Selecione uma entidade para carregar o form dinamico e os registros."}
                </p>
              </div>
              {selectedEntity ? (
                <div className="rounded-full border border-slate-900/8 bg-white/80 px-4 py-3 text-sm text-slate-700">
                  {recordsLoading
                    ? "Carregando registros..."
                    : `${recordsPage.totalElements} registros`}
                </div>
              ) : null}
            </div>

            {selectedEntity ? (
              <form className="mt-6 space-y-4" onSubmit={handleCreateRecord}>
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedEntity.fields.map((field) => {
                    const currentValue = recordFormValues[field.name];
                    const required = field.required;
                    const label = field.label || field.name;

                    if (field.type === "TEXT") {
                      return (
                        <label className="block space-y-2 md:col-span-2" key={field.name}>
                          <span className="text-sm font-medium text-slate-700">
                            {label}
                          </span>
                          <textarea
                            className="field min-h-28 resize-y"
                            onChange={(event) =>
                              handleRecordValueChange(field.name, event.target.value)
                            }
                            placeholder={`Digite ${label.toLowerCase()}`}
                            required={required}
                            value={typeof currentValue === "string" ? currentValue : ""}
                          />
                        </label>
                      );
                    }

                    if (field.type === "ENUM") {
                      return (
                        <label className="block space-y-2" key={field.name}>
                          <span className="text-sm font-medium text-slate-700">
                            {label}
                          </span>
                          <select
                            className="field"
                            onChange={(event) =>
                              handleRecordValueChange(field.name, event.target.value)
                            }
                            required={required}
                            value={typeof currentValue === "string" ? currentValue : ""}
                          >
                            <option value="">Selecione</option>
                            {(field.options ?? []).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      );
                    }

                    if (field.type === "BOOLEAN") {
                      return (
                        <label
                          className="flex min-h-[64px] items-center justify-between rounded-2xl border border-slate-900/8 bg-white/85 px-4 py-3"
                          key={field.name}
                        >
                          <span className="text-sm font-medium text-slate-700">{label}</span>
                          <input
                            checked={Boolean(currentValue)}
                            onChange={(event) =>
                              handleRecordValueChange(field.name, event.target.checked)
                            }
                            type="checkbox"
                          />
                        </label>
                      );
                    }

                    const inputType =
                      field.type === "EMAIL"
                        ? "email"
                        : field.type === "URL"
                          ? "url"
                          : field.type === "DATE"
                            ? "date"
                            : "text";

                    return (
                      <label className="block space-y-2" key={field.name}>
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                        <input
                          className="field"
                          inputMode={field.type === "NUMBER" ? "decimal" : undefined}
                          onChange={(event) =>
                            handleRecordValueChange(field.name, event.target.value)
                          }
                          placeholder={`Digite ${label.toLowerCase()}`}
                          required={required}
                          type={inputType}
                          value={typeof currentValue === "string" ? currentValue : ""}
                        />
                      </label>
                    );
                  })}
                </div>

                {recordActionError ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {recordActionError}
                  </p>
                ) : null}

                {recordActionSuccess ? (
                  <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {recordActionSuccess}
                  </p>
                ) : null}

                <button className="button-primary w-full" disabled={isCreatingRecord} type="submit">
                  {isCreatingRecord ? "Salvando registro..." : "Criar registro"}
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-[1.3rem] border border-dashed border-slate-900/16 bg-white/60 p-5 text-sm leading-7 text-slate-600">
                Escolha uma entidade na coluna ao lado para renderizar o formulario dinamico.
              </div>
            )}
          </section>

          <section className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-ink">Ultimos registros</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Lista paginada carregada via `entity-engine` com o schema do tenant selecionado.
                </p>
              </div>
            </div>

            {recordsError ? (
              <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {recordsError}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              {recordsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-[1.3rem] border border-slate-900/8 bg-white/70"
                  />
                ))
              ) : recordsPage.content.length > 0 && selectedEntity ? (
                recordsPage.content.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-[1.3rem] border border-slate-900/8 bg-white/85 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {selectedEntity.displayName || selectedEntity.name}
                        </p>
                        <p className="mt-2 font-mono text-sm text-slate-600">
                          {record.id}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500">
                        Atualizado em {formatInstant(record.updatedAt)}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {selectedEntity.fields.map((field) => (
                        <div
                          key={`${record.id}-${field.name}`}
                          className="rounded-2xl bg-slate-900/4 px-4 py-3"
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                            {field.label || field.name}
                          </p>
                          <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {formatRecordValue(record.data[field.name])}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.3rem] border border-dashed border-slate-900/16 bg-white/60 p-5 text-sm leading-7 text-slate-600">
                  {selectedEntity
                    ? "Ainda nao existem registros para essa entidade."
                    : "Nenhum contexto de entidade selecionado para listar registros."}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
