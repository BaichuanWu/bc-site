import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Button,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Code as CodeIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useItemList } from "Src/renderer/hooks/useItemList";
import { ItemListProvider } from "Src/renderer/hooks/ItemListProvider";
import PageContainer from "Src/renderer/components/PageContainer";
import ItemCard from "Src/renderer/components/ItemCard";
import ItemDialog from "Src/renderer/components/ItemDialog";

interface Template {
  id: string;
  name: string;
  description: string;
  formula: string;
  variables: Variable[];
  createdAt: string;
  updatedAt: string;
}

interface Variable {
  name: string;
  type: string;
  dataset: string;
  defaultValue: string;
  required: boolean;
}

const availableDatasets = [
  "Price",
  "Volume",
  "MarketCap",
  "News",
  "SocialMedia",
  "Sentiment",
  "Technical",
  "Fundamental",
];
const variableTypes = [
  "price",
  "volume",
  "numeric",
  "integer",
  "string",
  "boolean",
];

const TemplatePageContent = () => {
  const { t } = useTranslation();
  const {
    items: templates,
    addItem: addTemplate,
    updateItem: updateTemplate,
    deleteItem: deleteTemplate,
  } = useItemList<Template>();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    name: "",
    description: "",
    formula: "",
    variables: [],
  });
  const [currentVariable, setCurrentVariable] = useState<Partial<Variable>>({
    name: "",
    type: "numeric",
    dataset: "",
    defaultValue: "",
    required: true,
  });

  const handleCreate = () => {
    addTemplate(newTemplate as Omit<Template, "id">);
    setNewTemplate({ name: "", description: "", formula: "", variables: [] });
    setOpenDialog(false);
  };

  const handleUpdate = () => {
    if (editingTemplate) {
      updateTemplate(editingTemplate);
      setEditingTemplate(null);
      setOpenDialog(false);
    }
  };

  const handleAddVariable = () => {
    if (!currentVariable.name || !currentVariable.dataset) return;
    const variable: Variable = {
      name: currentVariable.name,
      type: currentVariable.type || "numeric",
      dataset: currentVariable.dataset,
      defaultValue: currentVariable.defaultValue || "",
      required: currentVariable.required !== false,
    };
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        variables: [...editingTemplate.variables, variable],
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        variables: [...(newTemplate.variables || []), variable],
      });
    }
    setCurrentVariable({
      name: "",
      type: "numeric",
      dataset: "",
      defaultValue: "",
      required: true,
    });
  };

  const handleRemoveVariable = (index: number) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        variables: editingTemplate.variables.filter((_, i) => i !== index),
      });
    } else {
      setNewTemplate({
        ...newTemplate,
        variables: (newTemplate.variables || []).filter((_, i) => i !== index),
      });
    }
  };

  const handleGenerateAlpha = (template: Template) => {
    // 保留生成alpha的功能
    console.log("Generating alpha from template:", template);
  };

  const renderDetails = (template: Template) => (
    <>
      <Typography variant="h6" gutterBottom>
        {template.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {template.description}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("公式")}:
        </Typography>
        <Chip
          label={template.formula}
          icon={<CodeIcon />}
          variant="outlined"
          sx={{ fontFamily: "monospace" }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("变量")}:
        </Typography>
        {template.variables.map((variable, index) => (
          <Chip
            key={index}
            label={`${variable.name} (${variable.dataset})`}
            size="small"
            variant="outlined"
            sx={{ mr: 0.5, mb: 0.5 }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {t("创建于")}: {template.createdAt} | {t("更新于")}:{" "}
        {template.updatedAt}
      </Typography>
    </>
  );

  const renderForm = (
    template: Partial<Template>,
    setTemplate: (template: Partial<Template>) => void,
  ) => (
    <>
      <TextField
        autoFocus
        margin="dense"
        label={t("模板名称")}
        fullWidth
        variant="outlined"
        value={template.name}
        onChange={(e) => setTemplate({ ...template, name: e.target.value })}
        sx={{ mb: 2 }}
      />
      <TextField
        margin="dense"
        label={t("描述")}
        fullWidth
        multiline
        rows={2}
        variant="outlined"
        value={template.description}
        onChange={(e) =>
          setTemplate({ ...template, description: e.target.value })
        }
        sx={{ mb: 2 }}
      />
      <TextField
        margin="dense"
        label={t("公式")}
        fullWidth
        variant="outlined"
        value={template.formula}
        onChange={(e) => setTemplate({ ...template, formula: e.target.value })}
        sx={{ mb: 2 }}
        placeholder={t("例如: rank(ts_delta(close, 5)) * -1")}
      />
      <Divider sx={{ my: 2 }}>
        <Typography variant="subtitle2">{t("变量配置")}</Typography>
      </Divider>
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          label={t("变量名")}
          size="small"
          value={currentVariable.name}
          onChange={(e) =>
            setCurrentVariable({ ...currentVariable, name: e.target.value })
          }
          sx={{ minWidth: 120 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t("类型")}</InputLabel>
          <Select
            value={currentVariable.type}
            label={t("类型")}
            onChange={(e) =>
              setCurrentVariable({ ...currentVariable, type: e.target.value })
            }
          >
            {variableTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t("数据集")}</InputLabel>
          <Select
            value={currentVariable.dataset}
            label={t("数据集")}
            onChange={(e) =>
              setCurrentVariable({
                ...currentVariable,
                dataset: e.target.value,
              })
            }
          >
            {availableDatasets.map((dataset) => (
              <MenuItem key={dataset} value={dataset}>
                {dataset}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label={t("默认值")}
          size="small"
          value={currentVariable.defaultValue}
          onChange={(e) =>
            setCurrentVariable({
              ...currentVariable,
              defaultValue: e.target.value,
            })
          }
          sx={{ minWidth: 100 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={currentVariable.required !== false}
              onChange={(e) =>
                setCurrentVariable({
                  ...currentVariable,
                  required: e.target.checked,
                })
              }
            />
          }
          label={t("必需")}
        />
        <Button
          variant="outlined"
          onClick={handleAddVariable}
          disabled={!currentVariable.name || !currentVariable.dataset}
        >
          {t("添加变量")}
        </Button>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("已配置变量")}:
        </Typography>
        {(template.variables || []).map((variable, index) => (
          <Chip
            key={index}
            label={`${variable.name} (${variable.dataset}) ${
              variable.required ? "*" : ""
            }`}
            onDelete={() => handleRemoveVariable(index)}
            sx={{ mr: 1, mb: 1 }}
          />
        ))}
      </Box>
    </>
  );

  return (
    <PageContainer
      title="Alpha模板管理"
      icon={<DescriptionIcon />}
      onCreate={() => {
        setEditingTemplate(null);
        setOpenDialog(true);
      }}
    >
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid key={template.id}>
            <ItemCard
              item={template}
              onEdit={(item) => {
                setEditingTemplate(item);
                setOpenDialog(true);
              }}
              onDelete={deleteTemplate}
              renderDetails={renderDetails}
            >
              <Button
                size="small"
                startIcon={<PlayArrowIcon />}
                onClick={() => handleGenerateAlpha(template)}
              >
                {t("生成Alpha")}
              </Button>
            </ItemCard>
          </Grid>
        ))}
      </Grid>
      <ItemDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={editingTemplate ? handleUpdate : handleCreate}
        item={editingTemplate || newTemplate}
        title={editingTemplate ? "编辑模板" : "新建模板"}
        renderForm={(item, setItem) => renderForm(item, setItem)}
      />
    </PageContainer>
  );
};

export default function TemplatePage() {
  return (
    <ItemListProvider>
      <TemplatePageContent />
    </ItemListProvider>
  );
}
