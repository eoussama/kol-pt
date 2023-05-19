import { useState } from 'react';
import { ViewMode } from '../core/enums/view-mode.enum';
import { useSettingsStore } from '../state/settings.state';



/**
 * @description
 * Manages view mode.
 */
export function useViewMode() {
  const { viewMode, setViewMode } = useSettingsStore();
  const compactViewColor: 'primary' | 'default' = viewMode === ViewMode.Compact ? 'primary' : 'default';
  const expandedViewColor: 'primary' | 'default' = viewMode === ViewMode.Expanded ? 'primary' : 'default';

  return { viewMode, compactViewColor, expandedViewColor, setViewMode };
}