import {InvokeSource} from "../extensions/invokeSource";

export enum TooltipType {
	ChangeLog,
	Pdf,
	Product,
	Recipe,
	Video,
	WhatsNew
}

export module TooltipTypeUtils {
	export function toInvokeSource(tooltipType: TooltipType): InvokeSource {
		switch (tooltipType) {
			case TooltipType.Pdf:
				return InvokeSource.PdfTooltip;
			case TooltipType.Product:
				return InvokeSource.ProductTooltip;
			case TooltipType.Recipe:
				return InvokeSource.RecipeTooltip;
			case TooltipType.Video:
				return InvokeSource.VideoTooltip;
			case TooltipType.WhatsNew:
				return InvokeSource.WhatsNewTooltip;
			default:
				throw Error("Invalid TooltipType passed in TooltipType.toInvokeSource");
		}
	}
}
