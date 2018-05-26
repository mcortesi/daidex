import { map, switchMap } from "rxjs/operators";
import { WidgetEpic } from ".";
import { select } from "../../../utils/rx";
import { ServerApi } from "../../server-api";
import { orderbookEvent } from "../actions";
import { never } from "rxjs";

export const orderbook = (api: ServerApi): WidgetEpic => changes =>
  changes.pipe(
    select("state", "tradeable"),
    switchMap(tradeable => never()),
    map(orderbookEvent)
  );
