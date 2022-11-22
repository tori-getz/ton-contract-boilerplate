import { beginCell, Cell } from "ton"

export const initData = (): Cell => {
    return beginCell().storeUint(10, 64).endCell();
}

export const initMessage = () => {
    return increment();
}

export const increment = () => {
    return beginCell().storeUint(0, 64).endCell();
}
