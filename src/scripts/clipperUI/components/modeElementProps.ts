import {ClipMode} from "../clipMode";

export interface PropsForModeElementNoAriaGrouping {
    imgSrc: string;
    label: string;
    myMode: ClipMode;
    selected?: boolean;
    tabIndex?: number;
    onModeSelected: (modeButton: ClipMode) => void;
    tooltipText?: string;
}