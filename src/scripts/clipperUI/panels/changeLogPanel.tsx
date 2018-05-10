import {Constants} from "../../constants";
import {Localization} from "../../localization/localization";
import {ChangeLog} from "../../versioning/changeLog";
import {ComponentBase} from "../componentBase";
import {TooltipProps} from "../tooltipProps";

class ChangeLogPanelClass extends ComponentBase<{}, TooltipProps.WhatsNew> {
	getInitialState(): {} {
		return {};
	}

	createChangeElement(change: ChangeLog.Change) {
		let image = change.imageUrl ?
			<img src={change.imageUrl}/> :
			undefined;

		return (
			<div className={Constants.Classes.change}>
				{image ?
					<div className={Constants.Classes.changeImage}>
						{image}
					</div> :
					undefined
				}
				<div className={Constants.Classes.changeBody}>
					<div className={Constants.Classes.changeTitle}>
						<span className="changeTitleFont"
									style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Semibold)}>
							{change.title}
						</span>
					</div>
					<div className={Constants.Classes.changeDescription}>
						<span className="changeDescriptionFont"
									style={Localization.getFontFamilyAsStyle(Localization.FontFamily.Regular)}>
							{change.description}
						</span>
					</div>
				</div>
			</div>
		);
	}

	getChangeElements() {
		let changeElements = [];
		for (let i = 0; i < this.props.updates.length; i++) {
			for (let j = 0; j < this.props.updates[i].changes.length; j++) {
				changeElements.push(this.createChangeElement(this.props.updates[i].changes[j]));
			}
		}
		return changeElements;
	}

	render() {
		return (
			<div className={Constants.Classes.changes}>
				{this.getChangeElements()}
			</div>
		);
	}
}

let component = ChangeLogPanelClass.componentize();
export {component as ChangeLogPanel}
