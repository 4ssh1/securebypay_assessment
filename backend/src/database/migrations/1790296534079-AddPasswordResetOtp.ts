import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetOtp1790296534079 implements MigrationInterface {
    name = 'AddPasswordResetOtp1790296534079'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_eafeabd780506c9b0effa84d84"`);
        await queryRunner.query(`ALTER TYPE "public"."otp_purpose" RENAME TO "otp_purpose_old"`);
        await queryRunner.query(`CREATE TYPE "public"."otp_purpose" AS ENUM('signup_verify', 'password_reset')`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "purpose" TYPE "public"."otp_purpose" USING "purpose"::"text"::"public"."otp_purpose"`);
        await queryRunner.query(`DROP TYPE "public"."otp_purpose_old"`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "balance" SET DEFAULT '0.00'`);
        await queryRunner.query(`CREATE INDEX "IDX_eafeabd780506c9b0effa84d84" ON "otp_codes" ("user_id", "purpose") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_eafeabd780506c9b0effa84d84"`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "balance" SET DEFAULT 0.00`);
        await queryRunner.query(`CREATE TYPE "public"."otp_purpose_old" AS ENUM('signup_verify')`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "purpose" TYPE "public"."otp_purpose_old" USING "purpose"::"text"::"public"."otp_purpose_old"`);
        await queryRunner.query(`DROP TYPE "public"."otp_purpose"`);
        await queryRunner.query(`ALTER TYPE "public"."otp_purpose_old" RENAME TO "otp_purpose"`);
        await queryRunner.query(`CREATE INDEX "IDX_eafeabd780506c9b0effa84d84" ON "otp_codes" ("user_id", "purpose") `);
    }

}
