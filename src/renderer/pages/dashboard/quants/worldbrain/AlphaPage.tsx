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
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Chip,
  Button,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Label as LabelIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useItemList } from "Src/renderer/hooks/useItemList";
import { ItemListProvider } from "Src/renderer/hooks/ItemListProvider";
import PageContainer from "Src/renderer/components/PageContainer";
import ItemCard from "Src/renderer/components/ItemCard";
import ItemDialog from "Src/renderer/components/ItemDialog";

interface Alpha {
  id: string;
  name: string;
  formula: string;
  status: "draft" | "tested" | "submitted" | "production";
  performance: PerformanceMetrics;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PerformanceMetrics {
  sharpeRatio: number;
  annualReturn: number;
  maxDrawdown: number;
  winRate: number;
}

const statusColors = {
  draft: "default",
  tested: "primary",
  submitted: "secondary",
  production: "success",
};

const statusLabels = {
  draft: "草稿",
  tested: "已测试",
  submitted: "已提交",
  production: "生产中",
};

const AlphaPageContent = () => {
  const { t } = useTranslation();
  const {
    items: alphas,
    addItem: addAlpha,
    updateItem: updateAlpha,
    deleteItem: deleteAlpha,
  } = useItemList<Alpha>();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAlpha, setEditingAlpha] = useState<Alpha | null>(null);
  const [newAlpha, setNewAlpha] = useState<Partial<Alpha>>({
    name: "",
    formula: "",
    status: "draft",
    tags: [],
  });
  const [currentTag, setCurrentTag] = useState("");
  const [tabValue, setTabValue] = useState(0);

  const handleCreate = () => {
    const alphaToAdd: Omit<Alpha, "id"> = {
      name: newAlpha.name || "未命名Alpha",
      formula: newAlpha.formula || "",
      status: newAlpha.status || "draft",
      tags: newAlpha.tags || [],
      performance: newAlpha.performance || {
        sharpeRatio: 0,
        annualReturn: 0,
        maxDrawdown: 0,
        winRate: 0,
      },
      createdAt: newAlpha.createdAt || new Date().toISOString(),
      updatedAt: newAlpha.updatedAt || new Date().toISOString(),
    };
    addAlpha(alphaToAdd);
    setNewAlpha({ name: "", formula: "", status: "draft", tags: [] });
    setOpenDialog(false);
  };

  const handleUpdate = () => {
    if (editingAlpha) {
      updateAlpha(editingAlpha);
      setEditingAlpha(null);
      setOpenDialog(false);
    }
  };

  const handleAddTag = () => {
    if (!currentTag.trim()) return;
    if (editingAlpha) {
      setEditingAlpha({
        ...editingAlpha,
        tags: [...editingAlpha.tags, currentTag.trim()],
      });
    } else {
      setNewAlpha({
        ...newAlpha,
        tags: [...(newAlpha.tags || []), currentTag.trim()],
      });
    }
    setCurrentTag("");
  };

  const handleRemoveTag = (tag: string) => {
    if (editingAlpha) {
      setEditingAlpha({
        ...editingAlpha,
        tags: editingAlpha.tags.filter((t) => t !== tag),
      });
    } else {
      setNewAlpha({
        ...newAlpha,
        tags: (newAlpha.tags || []).filter((t) => t !== tag),
      });
    }
  };

  const renderDetails = (alpha: Alpha) => (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          {alpha.name}
        </Typography>
        <Chip
          label={t(statusLabels[alpha.status])}
          color={
            statusColors[alpha.status] as
              | "default"
              | "primary"
              | "secondary"
              | "success"
          }
          size="small"
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("公式")}:
        </Typography>
        <Chip
          label={alpha.formula}
          variant="outlined"
          sx={{ fontFamily: "monospace", mb: 1 }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("性能指标")}:
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>{t("夏普比率")}</TableCell>
                <TableCell align="right">
                  {alpha.performance.sharpeRatio.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("年化收益")}</TableCell>
                <TableCell align="right">
                  {alpha.performance.annualReturn.toFixed(1)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("最大回撤")}</TableCell>
                <TableCell align="right">
                  {alpha.performance.maxDrawdown.toFixed(1)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("胜率")}</TableCell>
                <TableCell align="right">
                  {alpha.performance.winRate.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("标签")}:
        </Typography>
        {alpha.tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            icon={<LabelIcon />}
            sx={{ mr: 0.5, mb: 0.5 }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {t("创建于")}: {alpha.createdAt} | {t("更新于")}: {alpha.updatedAt}
      </Typography>
    </>
  );

  const renderForm = (
    alpha: Partial<Alpha>,
    setAlpha: (alpha: Partial<Alpha>) => void,
  ) => (
    <>
      <TextField
        autoFocus
        margin="dense"
        label={t("Alpha名称")}
        fullWidth
        variant="outlined"
        value={alpha.name}
        onChange={(e) => setAlpha({ ...alpha, name: e.target.value })}
        sx={{ mb: 2 }}
      />
      <TextField
        margin="dense"
        label={t("公式")}
        fullWidth
        multiline
        rows={2}
        variant="outlined"
        value={alpha.formula}
        onChange={(e) => setAlpha({ ...alpha, formula: e.target.value })}
        sx={{ mb: 2 }}
        placeholder={t("例如: rank(ts_delta(close, 5)) * -1")}
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t("状态")}</InputLabel>
        <Select
          value={alpha.status}
          label={t("状态")}
          onChange={(e) =>
            setAlpha({
              ...alpha,
              status: e.target.value as
                | "draft"
                | "tested"
                | "submitted"
                | "production",
            })
          }
        >
          <MenuItem value="draft">{t("草稿")}</MenuItem>
          <MenuItem value="tested">{t("已测试")}</MenuItem>
          <MenuItem value="submitted">{t("已提交")}</MenuItem>
          <MenuItem value="production">{t("生产中")}</MenuItem>
        </Select>
      </FormControl>
      <Divider sx={{ my: 2 }}>
        <Typography variant="subtitle2">{t("标签管理")}</Typography>
      </Divider>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          label={t("添加标签")}
          size="small"
          value={currentTag}
          onChange={(e) => setCurrentTag(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
          sx={{ flexGrow: 1 }}
        />
        <Button variant="outlined" onClick={handleAddTag}>
          {t("添加")}
        </Button>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("当前标签")}:
        </Typography>
        {(alpha.tags || []).map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            onDelete={() => handleRemoveTag(tag)}
            sx={{ mr: 1, mb: 1 }}
          />
        ))}
      </Box>
    </>
  );

  return (
    <PageContainer
      title="Alpha因子管理"
      icon={<TrendingUpIcon />}
      onCreate={() => {
        setEditingAlpha(null);
        setOpenDialog(true);
      }}
    >
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label={t("所有Alpha")} />
        <Tab label={t("草稿")} />
        <Tab label={t("已测试")} />
        <Tab label={t("已提交")} />
        <Tab label={t("生产中")} />
      </Tabs>
      <Grid container spacing={3}>
        {alphas
          .filter((alpha) => {
            if (tabValue === 0) return true;
            if (tabValue === 1) return alpha.status === "draft";
            if (tabValue === 2) return alpha.status === "tested";
            if (tabValue === 3) return alpha.status === "submitted";
            if (tabValue === 4) return alpha.status === "production";
            return true;
          })
          .map((alpha) => (
            <Grid key={alpha.id}>
              <ItemCard
                item={alpha}
                onEdit={(item) => {
                  setEditingAlpha(item);
                  setOpenDialog(true);
                }}
                onDelete={deleteAlpha}
                renderDetails={renderDetails}
              />
            </Grid>
          ))}
      </Grid>
      <ItemDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={editingAlpha ? handleUpdate : handleCreate}
        item={editingAlpha || newAlpha}
        title={editingAlpha ? "编辑Alpha" : "新建Alpha"}
        renderForm={(item, setItem) => renderForm(item, setItem)}
      />
    </PageContainer>
  );
};

export default function AlphaPage() {
  return (
    <ItemListProvider>
      <AlphaPageContent />
    </ItemListProvider>
  );
}
