import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { ItemsService, StoreService, WarehouseService } from "../../client";
import {
  Box,
  Button,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";
import { relative } from "path";

const ShipStore: React.FC = () => {
  const [warehouse, setWarehouse] = useState("");
  const [store, setStore] = useState("");
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [formError, setError] = useState("");

  const { data: items } = useQuery({
    queryKey: ["items"],
    queryFn: () => ItemsService.readItems({}),
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => WarehouseService.getWarehouses(),
  });
  const { data: stores } = useQuery({
    queryKey: ["stores"],
    queryFn: () => StoreService.getStores(),
  });

  const handleStoreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStore(event.target.value);
  };

  const handleItemChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItem(event.target.value);
  };

  const handleQuantityChange = (
    valueAsString: string,
    valueAsNumber: number
  ) => {
    setQuantity(valueAsNumber);
  };

  const handleWarehouseChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setWarehouse(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setError("");
    event.preventDefault();
    try {
      await WarehouseService.shipItem({
        id: warehouse,
        item_id: item,
        store_id: store,
        quantity,
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ height: "100%" }}>
      <Stack
        position="relative"
        height="100%"
        spacing={3}
        justifyContent={"flex-end"}
      >
        <Select
          value={warehouse}
          color={"black"}
          onChange={handleWarehouseChange}
          placeholder="Select Warehouse"
        >
          {warehouses?.data.map((item) => (
            <option color="white" key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select
          value={store}
          color={"black"}
          onChange={handleStoreChange}
          placeholder="Select Store"
        >
          {stores?.data.map((item) => (
            <option color="white" key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select
          value={item}
          color={"black"}
          onChange={handleItemChange}
          placeholder="Select Item"
        >
          {items?.data.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </Select>
        <NumberInput
          value={quantity}
          onChange={handleQuantityChange}
          placeholder="Enter QTY"
          color={"black"}
          min={0}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Button color="black" bg="white" type="submit">
          Submit
        </Button>
        {formError ? (
          <Box position={"absolute"} top={-5} left={-10}>
            <Tooltip label={formError}>
              <InfoIcon color="red.500" />
            </Tooltip>
          </Box>
        ) : null}
      </Stack>
    </form>
  );
};

export default ShipStore;
