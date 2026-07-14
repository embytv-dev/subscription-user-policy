import config from "../../config/config";
import {Injectable, Logger} from '@nestjs/common';
import {PoolConnection, RowDataPacket} from 'mysql2/promise';

export interface SubscriptionsRow {
    id: number;
    userUuid: string;
    paymentPlanId: number;
    status: string;
    startDate: Date;
    endDate: Date | null;
    stripeSubscriptionId: string | null;
    ldapUserName: string | null;
    ldapUserPassword: string | null;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    subscriptionPurchaseMethod: string;
    nextPaymentPlanId: number | null;
}

interface SubscriptionsQueryRow extends RowDataPacket, SubscriptionsRow {
}

@Injectable()
export class SubscriptionsService {
    private readonly logger = new Logger(SubscriptionsService.name);

    private readonly usersSubscriptionsTable = `${config.mysql.dbPortal}.subscriptions`;

    async isHasActiveSubscription(conn: PoolConnection, ldap_user_name: string): Promise<boolean> {
        const [rows] = await conn.query<SubscriptionsQueryRow[]>(
            `SELECT
                *
             FROM ${this.usersSubscriptionsTable}
             WHERE ldap_user_name = ?
               AND status = ? LIMIT 1`,
            [ldap_user_name, 'ACTIVE'],
        );

        if (rows.length === 0) {
            this.logger.log(`Active subscription not found for user=${ldap_user_name}`);
            return false;
        }

        this.logger.log(`Active subscription found for user=${ldap_user_name}. Subscription:`, rows[0]);
        return true;
    }
}
