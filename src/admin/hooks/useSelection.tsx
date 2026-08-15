import { useState } from 'react';

type SelectionId = number | string;

const useSelection = (initialSelection = []) => {
  const [selected, setSelected] = useState<readonly SelectionId[]>(initialSelection || []);

  const isSelected = (id: SelectionId) => selected.indexOf(id) !== -1;

  const toggleSelection = (id: SelectionId) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly SelectionId[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const resetSelection = () => setSelected([]);

  return { selected, isSelected, toggleSelection, resetSelection };
};

export default useSelection;
